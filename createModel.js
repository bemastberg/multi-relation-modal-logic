let numberOfWorlds = 0;
let newRelation = new Object();
let newWorlds = new Object();

const agents = new Array('a', 'b', 'c')
function relations() {
    document.getElementById("relations").innerHTML = 'Input successor worlds for each agent and world <br>'
    for (const agent of agents) {
        document.getElementById("relations").innerHTML += `Agent ${agent}<br>`
        for (let i = 0; i < numberOfWorlds; i++) {
            document.getElementById("relations").innerHTML += `<label for="agent${i}">World ${i}</label><input type="text" name="agent${i}" id="agent${agent}world${i}" /><br>`
        }
    }
    document.getElementById("relations").innerHTML += `<input type='button' value='Submit relations!' onclick='truthValues()'>`
}

function truthValues() {

    document.getElementById("truthvalues").innerHTML = ''
    for (let i = 0; i < numberOfWorlds; i++) {
        document.getElementById("truthvalues").innerHTML += `<label for="world${i}">World ${i}</label><input type="text" name="world${i}" id="world${i}" /><br>`;
    }
    document.getElementById("truthvalues").innerHTML += `<input type='button' value='Submit valuations!' onclick='createModel()'>`
}
function selectNumberOfWorlds() {
    numberOfWorlds = parseInt(document.getElementById("worlds").value);
    console.log(numberOfWorlds)
    relations()
}

function createModel() {
    for (let y = 0; y < numberOfWorlds; y++) {
        newWorlds[y] = document.getElementById(`world${y}`).value

    }
    for (const agent of agents) {
        newRelation[agent] = new Object();
        for (const world of Object.keys(newWorlds)) {
            newRelation[agent][world] = document.getElementById(`agent${agent}world${world}`).value.split('');

        }
    }
    showModel()
}

function showModel() {
    for (const world of Object.keys(newWorlds)) {
        document.getElementById("showmodelvaluations").innerHTML += `<span>w${world}: ${newWorlds[world]}</span><br>`
    }
    for (const agent of Object.keys(newRelation)) {
        document.getElementById("showmodelrelations").innerHTML += `${agent}<br>`
        for (const world of Object.keys(newRelation[agent])) {
            document.getElementById("showmodelrelations").innerHTML += `w${world}: ${newRelation[agent][world]}<br>`
        }
    }
    document.getElementById("savemodel").innerHTML = `Save your model - input filename <input type='text' id='inputmodelname'><input type='button' onclick='saveModel()'><br>`
}

function saveModel() {
    const model = new Object({ 'worlds': newWorlds, 'relations': newRelation })
    const filename = document.getElementById('inputmodelname').value
    localStorage.setItem(`${filename}`, JSON.stringify(model))
}
