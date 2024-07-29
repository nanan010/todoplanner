async function fetchTasks(){
    var res = await fetch("/tasks");
    var data = await res.json();
    const [newdata, oldindex] = sortthedata(data);
    (newdata).forEach((data, index)=>{
        if(index==oldindex){
            let oldertask = document.createElement("div");
            oldertask.textContent = "Older Tasks";
            oldertask.className = "dateheader";
            oldertask.style.display = "block";
            oldertask.style.fontSize = "25px";
            document.getElementById("parent").append(oldertask);

        }
        let datehead = document.createElement("div");
        datehead.className = "dateheader";
        datehead.style.display = "block";

        let dateheader = document.createElement("span");
        dateheader.textContent = data._id;
        dateheader.textContent = checktoday(data._id);                
        dateheader.className = "dateheadertext";

        let arrow = document.createElement("i");
        arrow.classList.add('fa','fa-caret-down');
        arrow.style.display = "inline";
        
        let displaylist = document.createElement("div");
        displaylist.id = "datelistview";
        displaylist.style.display = "block";
        
        arrow.onclick = ()=>{openOrCloseView(arrow, displaylist);};

        document.getElementById("parent").append(datehead);
        datehead.append(dateheader);
        datehead.append(arrow);
        document.getElementById("parent").append(displaylist);
        data.documents.sort((a, b) => a.time > b.time ? 1 : -1);
        count = 0;
        (data.documents).forEach((dataitem, index)=>{
            count += appendTaskitem(displaylist, dataitem._id, dataitem.title, dataitem.date, dataitem.time, dataitem.checked);
        });

        let overduecount = document.createElement('p');
        overduecount.textContent = "OverDue Tasks: "+count + "/" + data.count;
        overduecount.style.display = "inline";
        overduecount.style.float = 'right';
        overduecount.style.margin = '0px';
        datehead.append(overduecount);
    });
    console.log("checking");
    loadingpage(0);
    modefromstorage();
}

function openOrCloseView(parent, view){
    if(view.style.display=="block"){
        view.style.display = "none";
        parent.classList.remove('fa-caret-down');
        parent.classList.add('fa-caret-up');
    } else{
        view.style.display = "block";
        parent.classList.remove('fa-caret-up');
        parent.classList.add('fa-caret-down');
    }
}

function checktoday(date){
    var today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    
    var tdate = date.split("-");
    var taskdate = new Date(tdate[0], tdate[1]-1, tdate[2], 0, 0, 0, 0);
    
    var tomo = new Date(today);
    tomo.setDate(today.getDate()+1);
    
    //today
    if(today.getTime() == taskdate.getTime()){
        return "Today";
    } else if(tomo.getTime() == taskdate.getTime()){
        return "Tomorrow";
    } else{
        //display the day of the week for other 5 days.
        let sevenDaysFromToday = new Date();
        sevenDaysFromToday.setDate(tomo.getDate() + 5);
        if(taskdate > tomo && taskdate <= sevenDaysFromToday){
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return daysOfWeek[taskdate.getDay()];
        } else{
            const monthName = taskdate.toLocaleString('default', { month: 'long' });
            return monthName+ " "+ tdate[2] +" "+ tdate[0];
        }
    }
    return date;
}

function sortthedata(data){
    todayindex = -1
    var today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0 ,0);
    for(let i=0; i< data.length; i++){
        var tdate = data[i]._id.split("-");
        var date = new Date(tdate[0], tdate[1]-1, tdate[2], 0, 0, 0, 0);
        if(date >= today){
            todayindex = i;
            break;
        }
    }
    oldindex = data.length - todayindex;
    sorteddata = data.slice(todayindex).concat(data.slice(0, todayindex));
    return [sorteddata, oldindex];
}

document.addEventListener("DOMContentLoaded", ()=>{
    loadingpage(1);
    fetchTasks();
});

function openPopup(){
    document.getElementById("popup").style.display = "flex";
    document.body.style.overflow = "hidden";
    document.getElementById("editForm").style.display = "none";
    document.getElementById("addForm").style.display = "block";
    document.getElementById("popuptitle").textContent = "Add Task";

}

function closepopup(){
    document.getElementById("popup").style.display = "none";
    document.body.style.overflow = "auto";
}

function appendTaskitem(parentView, taskiden, title, taskdate, taskTime, complete){
    var overdue = 0;
    let child = document.createElement('div');
    child.className = "tasklist";
    
    //checkbox
    let check = document.createElement("input");
    check.setAttribute('type','checkbox');
    check.id = "checkbox";
    check.checked = complete;

    //delete icon
    let iconlayout = document.createElement('div');
    iconlayout.className = "iconlayout";
    let edit = document.createElement('i');
    edit.id = "edit";
    edit.title = "Edit";
    edit.classList.add('fa-solid','fa-pencil', 'icon');
    iconlayout.append(edit);
    let del = document.createElement('i');
    del.id = "del";
    del.title = "Delete"
    del.classList.add('fa-solid','fa-trash','icon');
    iconlayout.append(del);

    //title
    let label = document.createElement("label");
    label.textContent = title;
    label.htmlFor = "checkbox";
    label.className = "checkboxlabel"
    if(complete){
        label.innerHTML = "<s>"+title+"</s>";
    } else if(checkIfOverdue(taskdate, taskTime)){
        label.className = "latetitle";
        overdue = 1;
    }

    del.onclick = ()=>{deletetask(del, taskiden);}
    edit.onclick = ()=>{openEditPopup(taskiden, title, taskdate, taskTime, complete);}
    check.onclick = ()=>{checkboxclicked(check, label, taskiden)};
    
    let cDate = document.createElement("p");
    cDate.textContent = taskTime;
    cDate.className = "listdate";

    child.setAttribute("taskid", taskiden);

    child.appendChild(check);
    child.appendChild(label);
    child.appendChild(cDate);
    child.appendChild(iconlayout);
    
    //document.getElementById("parent").appendChild(child);
    parentView.appendChild(child);
    return overdue;
}

function checkIfOverdue(taskDate, taskTime){
    let today = new Date();
    let dateArray = (taskDate).split("-");
    let time = taskTime.split(":");
    let tDate = new Date(dateArray[0], dateArray[1]-1, dateArray[2], time[0], time[1], 0, 0);
    tDate.setMinutes(tDate.getMinutes()+5);
    if(today>tDate){
        return true;
    }
    return false;
}

function checkboxclicked(checkbox, label, taskid){
    if(checkbox.checked){
        label.innerHTML = "<s>"+label.innerText+"</s>";
        //change color from overdue
        let mode = localStorage.getItem("mode");
        if(mode!=null){
            if(mode==0){
                label.style.color = "rgb(222, 184, 135)";
            } else{
                label.style.color = "rgb(77, 61, 45)";
            }
    }
        marktaskascomplete(taskid, true);
    } else{
        label.innerHTML = label.innerText;
        marktaskascomplete(taskid, false);
    }
}

async function marktaskascomplete(taskid, editedValue){
    try{
        var data = await fetch(`/${taskid}`, {method:'PUT', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({checked: editedValue})}
        );
    } catch (err){
        console.log("Error",err);
    }
}

function deletetask(del, taskid){
    if(confirm("Are you sure you want to delete this task?")){
        deletethecurrenttask(taskid);
    }
}

async function deletethecurrenttask(taskid){
    try{
        var result = await fetch(`/${taskid}`,{method: 'DELETE'});
        location.reload();
    } catch (err){
        console.log("Error from delete html",err);
    }
}

document.getElementById('datepicker').addEventListener('focus',()=>{
    let today = new Date();
    let date = today.toLocaleDateString('en-CA');
    let time = today.toLocaleDateString('en-GB',{ hour: '2-digit', minute: '2-digit' });
    time = time.split(",")[1].trim();
    let min = date+"T"+time;
    document.getElementById('datepicker').setAttribute('min',min);
    //document.getElementById('demo').innerHTML += "tool<br>"+min;
});

function togglebutton(){
    //local mode = 0 => dark, 1=> light
    let mode = document.getElementById("mode");  
    //light mode to dark mode
    if(mode.classList.contains("fa-moon")){
        localmode = 0;
    } else{
        //
        localmode = 1;
    }
    togglemode(localmode);
}

function modefromstorage(){
    //local mode = 0 => dark, 1=> light
    let localmode = 0;
    if(localStorage.getItem("mode")!=null){
        localmode = localStorage.getItem("mode");
        let mode = document.getElementById("mode"); 
        if(localmode){
            mode.classList.add('fa-moon');
            mode.classList.remove('fa-sun');
        } else{
            mode.classList.remove('fa-moon');
            mode.classList.add('fa-sun');
        }
    }
    togglemode(localmode);
}

function togglemode(localmode){
    //switch to dark mode from light mode
    let mode = document.getElementById("mode");  
    if(localmode==0){
        //localmode = 0;
        mode.classList.remove('fa-moon');
        mode.classList.add('fa-sun');
        document.body.classList.remove('lightmode');
        let add = document.getElementById("addview");
        add.classList.remove('lightmode');
        let parent = document.getElementById('parent');
        let popup = document.getElementById("popupwindow");
        popup.classList.remove("popuplight");
        document.getElementById("addForm").classList.remove("lightmode");
        document.getElementById("editForm").classList.remove("lightmode");
        document.getElementById("close").style.color = "white";
        for(let i=0;i<parent.children.length;i++){
            let child = parent.children[i];
            if(child.id=="datelistview"){
                for(let j=0;j<child.children.length;j++){
                    child.children[j].classList.remove("tasklistlight");
                    child.children[j].querySelector("#del").style.color = "burlywood";
                    child.children[j].querySelector("#edit").style.color = "burlywood";
                    
                }
            }
        }
    } /*switching from dark mode to light mode*/ 
    else{
        //localmode = 1;
        mode.classList.remove('fa-sun');
        mode.classList.add('fa-moon');
        document.body.classList.add('lightmode');
        let add = document.getElementById("addview");
        add.classList.add('lightmode');
        let popup = document.getElementById("popupwindow");
        popup.classList.add("popuplight");
        document.getElementById("addForm").classList.add("lightmode");
        document.getElementById("editForm").classList.add("lightmode");
        document.getElementById("close").style.color = "black";
        let parent = document.getElementById('parent');
        for(let i=0;i<parent.children.length;i++){
            let child = parent.children[i];
            if(child.id=="datelistview"){
                for(let j=0;j<child.children.length;j++){
                    child.children[j].classList.add("tasklistlight");
                    child.children[j].querySelector("#del").style.color = "rgb(77, 61, 45)";
                    child.children[j].querySelector("#edit").style.color = "rgb(77, 61, 45)";
                }
            }
        }
    }
    savelocalmode(localmode);
}

function savelocalmode(mode){
    localStorage.setItem("mode",mode);
}

function openEditPopup(id, title, date, time, check){
    document.getElementById("popup").style.display = "flex";
    document.body.style.overflow = "hidden";
    document.getElementById("addForm").style.display = "none";
    document.getElementById("editForm").style.display = "block";
    document.getElementById("popuptitle").textContent = "Edit Task";
    
    let etitle = document.getElementById("etitle");
    etitle.value = title;

    let eDateTime = document.getElementById("edatepicker");
    eDateTime.value = date+"T"+time;

    let checkbox = document.getElementById('check');
    checkbox.checked = check;
    
    document.getElementById('save').onclick = ()=>{
        dateTime = eDateTime.value.split("T");
        editTask(id, etitle.value, dateTime[0], dateTime[1], checkbox.checked);
    }
}

async function editTask(id, title, date, time, check){
    try{
        let result = await fetch(`/edit/${id}`, {
            method : "PUT",
            headers : {'Content-Type': 'application/json'},
            body : JSON.stringify({title: title, date: date, time: time, checked: check})
        });
        location.reload();
    } catch(error){
        console.log("Error while updating..", error);
    }
} 

document.addEventListener("keyup",(e)=>{
    if(e.key === "Escape") {
        closepopup();
    }
});

function loadingpage(on){
    if(on){
        document.getElementById("loadingdiv").style.display = "flex";
        document.getElementById("body").style.display = "none";
    } else{
        document.getElementById("loadingdiv").style.display = "none";
        document.getElementById("body").style.display = "block";
    }
}