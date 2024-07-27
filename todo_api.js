var express = require('express');
const path = require('path');
var app = express();
const {MongoClient, ObjectId} = require("mongodb");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files (if any)
//app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

var url = "mongodb+srv://nive:nive@cluster0.lu5y67v.mongodb.net/?appName=Cluster0";
var client = new MongoClient(url);

app.get("/",function(req, res){
    //res.sendFile(__dirname + '/index.html');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get("/tasks",(req, res)=>{
    getAllTask(res);
});

app.put("/:id",(req, res)=>{
    const taskid = req.params.id;
    updateTask(taskid, req.body);
    //update the task list
});

app.delete("/:id",(req, res)=>{
    //delete the particular task with the help of ID
    const taskid = req.params.id;
    deleteTask(taskid, res);
});

async function deleteTask(taskid, res){
    try{
        await client.connect();
        var collection = client.db('tododb').collection('tasks');
        var data = await collection.deleteOne({_id: ObjectId.createFromHexString((taskid))});
        console.log("Delete Success"+ JSON.stringify(data));
        res.json(data);
    } catch(err){
        console.log("Error while deleting",err);
    }
    finally{
        await client.close();
    }
}

app.post("/submit",(req, res)=>{
    req.body['checked'] = false;
    var dateTime = (req.body.date).split("T");
    req.body['date'] = dateTime[0];
    req.body['time'] = dateTime[1];

    insertTask(req.body, res);
});

app.put("/edit/:id",(req, res)=>{
    editTask(req.params.id, req.body, res);
});

app.listen(3000,'0.0.0.0', function () {
    console.log("Express App running at port 3000");
});

async function insertTask(body, res){
    try{
        await client.connect();
        var db = client.db("tododb");
        var collection = db.collection("tasks");
        var result = await collection.insertOne(body);
        console.log("Data inserted");
    } catch(err){
        console.error("Error",err);
    }
    finally{
        await client.close();
        res.redirect('/');
    }
 }

async function getAllTask(res){
    try{
        await client.connect();
        console.log("Connection success!");
        var collection = client.db("tododb").collection("tasks");
        //var result = await collection.find().toArray();
        var result = await collection.aggregate([{ 
            $group : {
            _id: "$date",
            count: {$sum: 1},
            documents: { $push: "$$ROOT" }
            }
        }, {
            $sort : {_id: 1}
        }]).toArray();
        console.log("Data obtained");
        result.forEach((d, i)=>{
            console.log(i,JSON.stringify(d));
        });
        res.json(result);
        return result;
    } catch(err){
        console.error("Error from get all tasks",err);
    }
    finally{
        await client.close();
    }
}

async function updateTask(taskid, body){
    try{
        await client.connect();
        var collection = client.db("tododb").collection("tasks");
        var filter = {_id: ObjectId.createFromHexString(taskid)};
        var update = {$set:{checked: body.checked}};
        var result = await collection.updateOne(filter, update);
        console.log("Success", JSON.stringify(result));
    }catch(err){
        console.log("Error", err);
    }finally{
        await client.close();
    }
}

async function editTask(id, body, res){
    try{
        await client.connect();
        let collection = client.db("tododb").collection("tasks");
        var filter = {_id: ObjectId.createFromHexString(id)};
        var update = {$set:{title: body.title, date: body.date, time: body.time, checked: body.check}};
        var result = await collection.updateOne(filter, update);
        res.json(result);
        console.log("Success", JSON.stringify(result));
    } catch(err){
        console.log("Error from server- edit", err);
    }
    finally{
        await client.close();
    }
}