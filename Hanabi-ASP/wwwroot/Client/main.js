﻿window.onload = init;
$.post = function (url, data, CallBack, dataType) {
	return jQuery.ajax({
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/' + dataType
		},
		'type': 'POST',
		'url': url,
		'data': JSON.stringify(data),
		'dataType': dataType,
		'success': CallBack
	});
};

$.get = function (url, data, CallBack) {
	return jQuery.ajax({
		'type': 'GET',
		'url': url,
		'data': data,
		'response': 'xml',
		'success': CallBack
	});
};

function init() {
    LogInState = {
        type: "Player",
        InputNick: null,
        InputPassword: null,
        SubmitButton: null,
        Form: null,
        P: null
    };
    PickTableState = {
        CreateButton: null,
        JoinButton: null,
        Type: "Create"
    };
    PrepareState = {
        PlayerList: null
    };
    GameState = {
        StoryLen: 0,
        DropLen: 0
    };
	info = null;
    MainDiv = document.getElementById("main");
    PlayerPassword = "";
    PlayerId = -1;
    TableName = "";
    PlayerNick = "";
    TableId = -1;
    TablePassword = "";
    NowState = "LogIn";
    BuildLogIn("Player");
    tim = null;
}

function UpDateCallBack(newInfo) {
    if (NowState == "LogIn")
        return;
    var NewState;
    if (newInfo.idTable == -1)
        Newstate = "PickTable";
    else if (!newInfo.Table.GameStarted)
        NewState = "Prepare";
    else
        NewState = "Game";
    info = newInfo;
    if (NewState != NowState) {
        NowState = NewState;
        if (NowState == "PickTable") {
            BuildPickTable();
        }
        else if (NowState == "Prepare") {
            BuildPrepare();
        }
        else {
            BuildGame();
        }
    }
    else {
        if (NowState == "Prepare") {
            UpDatePrepare();
        }
        else if (NowState == "Game") {
            UpDateGame();
        }
    }
}

function UpDate() {
    $.get("../api/GetInfo", {
        idPlayer: PlayerId,
        PlayerPassword: PlayerPassword
    }, UpDateCallBack);
}

function LogInCallBack(id) {
    if (id == -1) {
        LogInState.Form.setAttribute("class", "Center has-error");
        LogInState.P.setAttribute("style", "");
    }
    else {
        tim = setInterval(UpDate, 1000);
        if (LogInState.type == "Player") {
            PlayerId = id;
            PlayerPassword = LogInState.InputPassword.value;
            NowState = "PickTable";
            PlayerNick = LogInState.InputNick.value;
            BuildPickTable();
        }
        else {
            TableId = id;
            TablePassword = LogInState.InputPassword.innerText;
            TableName = LogInState.InputNick.value;
            //need add
        }
    }
}

function LogInEvent() {
    if (LogInState.type == "Player")
        $.post('../api/LogIn', {
            "Nick": LogInState.InputNick.value,
            "Password": LogInState.InputPassword.value
        }, LogInCallBack, 'json');
    else if (PickTableState.Type == "Create")
        $.post('../api/CreateTable', {
            "idPlayer": PlayerId,
            "PlayerPassword": PlayerPassword,
            "TableName": LogInState.InputNick.value,
            "TablePassword": LogInState.InputPassword.value
        }, LogInCallBack, 'json');
    else
        $.post('../api/JoinTable', {
            "idPlayer": PlayerId,
            "PlayerPassword": PlayerPassword,
            "TableName": LogInState.InputNick.value,
            "TablePassword": LogInState.InputPassword.value
        }, LogInCallBack, 'json');
}

function CreateTableEvent() {
    PickTableState.Type = "Create";
    NowState = "LogIn";
    LogInState.type = "Table";
    BuildLogIn("Table");
    clearInterval(tim);
}

function JoinTableEvent() {
    PickTableState.Type = "Join";
    NowState = "LogIn";
    LogInState.type = "Table";
    BuildLogIn("Table");
    clearInterval(tim);
}

function BackEvent() {
    NowState = "PickTable";
    BuildPickTable();
    tim = setInterval(UpDate, 1000);
}

function UpdatePrepate() {
}

function UpDateStory() {
    while (info.Table.Game.Story.length > GameState.StoryLen) {
        //add to story
        GameState.StoryLen += 1;
    }
}

function UpDateDrop() {
    while (info.Table.Game.DropsCard.length > GameState.DropLen) {
        var card = info.Table.Game.DropsCard[GameState.DropLen];
        AddToDrop(card.Color, card.Number);
        GameState.DropLen += 1;
    }
}

function UpDateGame() {
    UpDateStory();
	UpDateDrop;
}

function BuildLogIn(type) {
    MainDiv.innerHTML = `
        <form class ="Center" id="Form">
            <div class="form-group">
                <label class="control-label" id="NickLabel">Nick:</label>
                <input type="text" class="form-control" id="nick" placeholder="Your nick"></input>
            </div>
            <div class="form-group">
                <label class ="control-label">Password: </label>
                <input type="password" class="form-control" id="pswd" placeholder="Password"></input>
            </div>
            <p id = "ErrorP" class ="text-danger" style="display:none">Вы неверно ввели Nick or password</p>
            <button type="button" class="btn btn-success" id="LogInButton">Log In</button>
    	<button type="button" class="btn pull-right" id="back" style="width:49%; display:none">Back</button></form>`;
    LogInState.SubmitButton = document.getElementById("LogInButton");
    LogInState.SubmitButton.onclick = LogInEvent;
    LogInState.InputNick = document.getElementById("nick");
    if (type != "Player") {
        LogInState.InputNick.setAttribute("placeholder", "Table's name");
        var lab = document.getElementById("NickLabel");
        lab.innerText = "Table:";
        var BackElem = document.getElementById("back");
        BackElem.setAttribute("style", style = "width:49%;");
        BackElem.onclick = BackEvent;
        if (PickTableState.Type == "Create")
            LogInState.SubmitButton.innerText = "Create";
        else if (PickTableState.Type == "Join")
            LogInState.SubmitButton.innerText = "Join";
    }
    LogInState.InputPassword = document.getElementById("pswd");
    LogInState.Form = document.getElementById("Form");
    LogInState.P = document.getElementById("ErrorP");
}

function BuildPickTable() {
    MainDiv.innerHTML = `
      <div class = "row">
      <div class = "col-xs-9"></div>
      <div class = "col-xs-2"><button class = "btn btn-success"><div id="CurNick" style = "font-weight:bold"></div></button>
      </div>
      <div class = "col-xs-1"></div>

      </div>
    <div style = "width: 100%;height: 65%; position:absolute; top: 35%">
    <div class = "row">
        <div class = "col-sm-4"></div>
        <div class = "col-sm-4">
        <div class = "button-group-vertical">
        <button type = "button" id="btnCreate" class = "btn btn-primary btn-block btn-lg">
            Create new table
        </button>
        <button class = "btn btn-primary btn-block btn-lg" id ="btnJoin">
            Join to exist table
        </button>
        </div>
        </div>
        <div class = "col-sm-4"></div>
    </div>
    </div>`;
    PickTableState.CreateButton = document.getElementById("btnCreate");
    PickTableState.CreateButton.onclick = CreateTableEvent;
    PickTableState.JoinButton = document.getElementById("btnJoin");
    PickTableState.JoinButton.onclick = JoinTableEvent;
    document.getElementById("CurNick").innerText = "Now play: " + PlayerNick;
}

function BuildPrepare() {

}

function BuildGame() {
    GameState.StoryLen = 0;
}

function ClearMainDiv() {
    while (MainDiv.childElementCount > 0)
        MainDiv.lastChild.remove();
}

function CreateComponentP(text) {
    var elem = document.createElement("p");
    elem.innerText = text;
    return elem;
}

function AddToDrop(color, number) {

}