import FormulaParser from "/node_modules/formula-parser/dist/formula-parser.es.js";
//const FormulaParser = require("./node_modules/formula-parser/dist/formula-parser.es.js")
//import FormulaParser from "./formula-parser.es.js";

//const FormulaParser = require('formula-parser.js');
//import { diamond, box, atom } from "./modalities.js";
import { forceReflexivity, forceSymmetry, forceTransitivity, forcedTransitions, removeForcedProperty } from "./forcedProperties.js";
import { publicAnnouncement } from "./dynamicOperations.js";
import { cartesian } from "./furtherModalities.js";
console.log(forcedTransitions)
//import relations1 from '/relations.json' assert {type: 'json'}

// from https://github.com/rkirsling/modallogic/blob/master/js/MPL.js
let relations = new Object();
let worlds = new Object();

//const relations = mooreanRelations;
//const worlds = mooreanWorlds;
const variableKey = 'prop';

const unaries = [
    { symbol: '~', key: 'neg', precedence: 4 },
    { symbol: `K`, key: `nec`, precedence: 4 },
    { symbol: '<>', key: 'poss', precedence: 4 },
    { symbol: 'D', key: 'diff', precedence: 4 },
    { symbol: 'E', key: 'glob', precedence: 4 }

];


const binaries = [
    { symbol: '&', key: 'conj', precedence: 3, associativity: 'right' },
    { symbol: '|', key: 'disj', precedence: 2, associativity: 'right' },
    { symbol: '->', key: 'impl', precedence: 1, associativity: 'right' },
    { symbol: '<->', key: 'equi', precedence: 0, associativity: 'right' },
    { symbol: '[!]', key: 'ann', precedence: 4, associativity: 'right' }
];

let form = document.querySelector('#getmodel')
let uploadRelations = document.querySelector('#inputrelations')
let uploadWorlds = document.querySelector('#inputworlds')
form.addEventListener('submit', handleSubmit)
function handleSubmit(event) {
    event.preventDefault();
    if (!uploadRelations.value.length) return;
    if (!uploadWorlds.value.length) return;
    let relationsReader = new FileReader();
    let worldsReader = new FileReader();
    relationsReader.onload = logFileRelations;
    worldsReader.onload = logFileWorlds;
    relations = relationsReader.readAsText(uploadRelations.files[0]);
    worlds = worldsReader.readAsText(uploadWorlds.files[0]);

}

function logFileWorlds(event) {
    let str = event.target.result;
    let json = JSON.parse(str);
    worlds = json;

}
function logFileRelations(event) {
    let str = event.target.result;
    let json = JSON.parse(str);
    relations = json;
    const agents = Object.keys(relations);
    for (const agent of agents) {
        unaries.push({ symbol: `K${agent}`, key: `nec${agent}`, precedence: 4 });
        unaries.push({ symbol: `<>${agent}`, key: `poss${agent}`, precedence: 4 })
    }
    console.log(relations)

}


window.getModel = async function () {
    const name = document.getElementById("inputmodel").value;
    const model = JSON.parse(localStorage.getItem(`${name}`));
    relations = model['relations'];
    worlds = model['worlds'];
    const agents = Object.keys(relations);
    for (const agent of agents) {
        unaries.push({ symbol: `K${agent}`, key: `nec${agent}`, precedence: 4 });
        unaries.push({ symbol: `<>${agent}`, key: `poss${agent}`, precedence: 4 })
    }


}

let checkboxReflexive = document.getElementById("reflexiveCheckBox");
let checkboxSymmetric = document.getElementById("symmetricCheckBox");
let checkboxTransitive = document.getElementById("transitiveCheckBox");

window.checkReflexivity = async function () {
    if (checkboxReflexive.checked === true) {
        forceReflexivity();
        //document.getElementById('result').innerHTML += forceReflexivity();
    }
    if (checkboxReflexive.checked !== true) {
        removeForcedProperty("Reflexive");
    }
    console.log(relations)
}
window.checkSymmetry = async function () {
    if (checkboxSymmetric.checked === true) {
        forceSymmetry();
        if (checkboxTransitive.checked === true) {
            forceTransitivity();
        }
        //document.getElementById('result').innerHTML += forceSymmetry();

    }
    if (checkboxSymmetric.checked !== true) {
        removeForcedProperty("Symmetric");
    }
}
window.checkTransitivity = async function () {
    if (checkboxTransitive.checked === true) {
        forceTransitivity();
        if (checkboxSymmetric.checked === true) {
            forceSymmetry();
        }
        //document.getElementById('result').innerHTML += forceTransitivity();
    }
    if (checkboxTransitive.checked !== true) {
        removeForcedProperty("Transitive");
    }
}


function truth(world, worlds, relations, parsedFormula) {
    if (parsedFormula.prop) {
        return (worlds[world].includes(parsedFormula.prop))
    }
    else if (parsedFormula.neg) {
        return !truth(world, worlds, relations, parsedFormula.neg)
    }
    else if (parsedFormula.conj) {
        return (truth(world, worlds, relations, parsedFormula.conj[0]) && truth(world, worlds, relations, parsedFormula.conj[1]))
    }
    else if (parsedFormula.disj) {
        return (truth(world, worlds, relations, parsedFormula.disj[0]) || (truth(world, worlds, relations, parsedFormula.disj[1])))
    }
    else if (parsedFormula.impl) {
        return (!truth(world, worlds, relations, parsedFormula.impl[0]) || (truth(world, worlds, relations, parsedFormula.impl[1])))
    }
    else if (parsedFormula.equi) {
        return (truth(world, worlds, relations, parsedFormula.equi[0]) === (truth(world, worlds, relations, parsedFormula.equi[1])))
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 3) === 'nec') {
        return (Array.from(relations[Object.keys(parsedFormula)[0].slice(3)][world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); }))
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'poss') {
        return (Array.from(relations[Object.keys(parsedFormula)[0].slice(4)][world]).some(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); }))
    }
    else if (parsedFormula.ann) {
        const announcedModel = publicAnnouncement(parsedFormula.ann[0], worlds, relations)
        return (truth(world, announcedModel[0], announcedModel[1], parsedFormula.ann[1]))
    }
    else if (parsedFormula.glob) {
        const globalModel = cartesian(true);
        return (globalModel[world]).some(function (succState) { return truth(succState, worlds, relations, parsedFormula.glob) })
    }
    else if (parsedFormula.diff) {
        const globalModel = cartesian(false);
        return (globalModel[world]).some(function (succState) { return truth(succState, worlds, relations, parsedFormula.diff) })
    }

    else { throw new Error('Invalid formula!') }
}
//let test = DELParser.parse('Kap')

window.evaluateFormula = async function () {

    const DELParser = new FormulaParser(variableKey, unaries, binaries)
    document.getElementById("result").innerHTML = ''
    const formula = document.getElementById("formula").value;
    const evaluationPoint = parseInt(document.getElementById("evaluationPoint").value);
    const parsedFormula = DELParser.parse(formula);
    // for (let world = 0; world < Object.keys(worlds).length; world++) {
    //     //console.log(truth(world, worlds, relations, parsedFormula))
    //     if (truth(world, worlds, relations, parsedFormula)) {
    //         document.getElementById("result").innerHTML += `<span style='color:green'>Formula is true at world ${world}</span><br>`
    //     } else {
    //         document.getElementById("result").innerHTML += `<span style='color:red'>Formula is false at world ${world}</span><br>`
    //     }
    // }
    if (truth(evaluationPoint, worlds, relations, parsedFormula)) {
        document.getElementById("result").innerHTML += `<span style='color:green'>Formula is true at world ${evaluationPoint}</span><br>`
    } else {
        document.getElementById("result").innerHTML += `<span style='color:red'>Formula is false at world ${evaluationPoint}</span><br>`
    }

}

export { relations, truth, worlds }



