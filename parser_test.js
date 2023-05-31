
import { FormulaParser } from "./formula-parser-es.js";
import { powerSet } from "./powerSetOfAgents.js";
import { forceReflexivity, forceSymmetry, forceTransitivity, forcedTransitions, removeForcedProperty } from "./forcedProperties.js";
import { publicAnnouncement } from "./dynamicOperations.js";
import { publicCommunication } from "./dynamicOperations.js";
import { cartesian, complement, inverse } from "./furtherModalities.js";
import { fromD3js, toD3js } from "./toD3Data.js";
import { everybodyKnows, distributedKnowledge, commonKnowledge } from "./groupNotions.js";
import { links, nodes, svg, removeNode, removeLinks, addForcedProperties, removeTransitiveEdges, removeForcedSymmetry, removeForcedReflexivity } from "./app.js";


// from https://github.com/rkirsling/modallogic/blob/master/js/MPL.js
let relations = new Object();
let worlds = new Object();
const variableKey = 'prop';
// let links = links;
// let nodes = nodes;

const unaries = [
    { symbol: '~', key: 'neg', precedence: 4 },
    { symbol: `K`, key: `nec`, precedence: 4 },
    { symbol: '<>', key: 'poss', precedence: 4 },
    { symbol: 'D', key: 'diff', precedence: 4 },
    { symbol: 'E', key: 'glob', precedence: 4 },
    { symbol: '[C!]', key: 'comm', precedence: 4 },
    { symbol: 'EK', key: 'ekno', precedence: 4 },
    { symbol: 'DK', key: 'dist', precedence: 4 },
    { symbol: 'CK', key: 'cokn', precedence: 4 },
    { symbol: '[|]', key: 'inac', precedence: 4 },
    { symbol: `[<-]`, key: `inve`, precedence: 4 }

];


const binaries = [
    { symbol: '&', key: 'conj', precedence: 3, associativity: 'right' },
    { symbol: '|', key: 'disj', precedence: 2, associativity: 'right' },
    { symbol: '->', key: 'impl', precedence: 1, associativity: 'right' },
    { symbol: '<->', key: 'equi', precedence: 0, associativity: 'right' },
    { symbol: '[!]', key: 'ann', precedence: 4, associativity: 'right' }
];



function populateUnariesBinaries() {
    const agents = Object.keys(relations);
    for (const agent of agents) {
        unaries.push(
            { symbol: `K${agent}`, key: `nec${agent}`, precedence: 4 },
            { symbol: `<>${agent}`, key: `poss${agent}`, precedence: 4 },
            { symbol: `[|]${agent}`, key: `inac${agent}`, precedence: 4 },
            { symbol: `[<-]${agent}`, key: `inve${agent}`, precedence: 4 },
        )
    }
    for (const agent of powerSet(agents)) {
        unaries.push(
            { symbol: `[C!]${agent}`, key: `comm${agent}`, precedence: 4 },
            { symbol: `EK${agent}`, key: `ekno${agent}`, precedence: 4 },
            { symbol: `DK${agent}`, key: `dist${agent}`, precedence: 4 },
            { symbol: `CK${agent}`, key: `cokn${agent}`, precedence: 4 },
        )
    }
}


let checkboxReflexive = document.getElementById("reflexiveCheckBox");
let checkboxSymmetric = document.getElementById("symmetricCheckBox");
let checkboxTransitive = document.getElementById("transitiveCheckBox");

window.checkReflexivity = async function () {
    if (checkboxReflexive.checked === true) {

        relations = forceReflexivity();
        addForcedProperties('Reflexive');
        console.log(nodes)
        document.getElementById("reflexive").style.fontWeight = "bold";
    }
    if (checkboxReflexive.checked !== true) {
        removeForcedReflexivity()
        relations = removeForcedProperty("Reflexive");
        document.getElementById("reflexive").style.fontWeight = "normal";
    }

}
window.checkSymmetry = async function () {
    if (checkboxSymmetric.checked === true) {
        relations = forceSymmetry();
        addForcedProperties('Symmetric');
        if (checkboxTransitive.checked === true) {
            relations = forceTransitivity();
        }
        document.getElementById("symmetric").style.fontWeight = "bold";
    }
    if (checkboxSymmetric.checked !== true) {
        removeForcedSymmetry()
        relations = removeForcedProperty("Symmetric");
        document.getElementById("symmetric").style.fontWeight = "normal";
    }
    ;

}
window.checkTransitivity = async function () {
    if (checkboxTransitive.checked === true) {
        relations = forceTransitivity();
        addForcedProperties("Transitive")
        if (checkboxSymmetric.checked === true) {
            relations = forceSymmetry();
        }
        document.getElementById("transitive").style.fontWeight = "bold";
    }
    if (checkboxTransitive.checked !== true) {
        removeTransitiveEdges();
        relations = removeForcedProperty("Transitive");

        document.getElementById("transitive").style.fontWeight = "normal";
    }
    //createGraph(false);
}


function truth(world, worlds, relations, parsedFormula) {
    console.log(parsedFormula)
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
        return (relations[Object.keys(parsedFormula)[0].slice(3)][world].every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); }))
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'poss') {
        return (relations[Object.keys(parsedFormula)[0].slice(4)][world].some(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); }))
    }
    else if (parsedFormula.ann) {
        const announcedModel = publicAnnouncement(parsedFormula.ann[0], worlds, relations)
        return (truth(world, announcedModel[0], announcedModel[1], parsedFormula.ann[1]))
    }
    // else if (parsedFormula.ann) {
    //     const announcedModel = publicAnnouncement(parsedFormula.ann, worlds, relations)
    //     return (truth(world, announcedModel[0], announcedModel[1], parsedFormula.ann))
    // }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'comm') {
        const communicatedModel = publicCommunication(Object.keys(relations), [...Object.keys(parsedFormula)[0].slice(4)].sort((a, b) => a.localeCompare(b)).join(""), worlds, relations);
        return truth(world, worlds, communicatedModel, parsedFormula[Object.keys(parsedFormula)[0]]);
    }
    else if (parsedFormula.glob) {
        const globalModel = cartesian(true);
        return (globalModel[world]).some(function (succState) { return truth(succState, worlds, relations, parsedFormula.glob) })
    }
    else if (parsedFormula.diff) {
        const globalModel = cartesian(false);
        return (globalModel[world]).some(function (succState) { return truth(succState, worlds, relations, parsedFormula.diff) })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'inac') {
        const complementModel = complement(worlds, relations);
        return (complementModel[Object.keys(parsedFormula)[0].slice(4)][world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'inve') {
        const inverseModel = inverse(worlds, relations);
        return (inverseModel[Object.keys(parsedFormula)[0].slice(4)][world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'ekno') {
        const unionizedModel = everybodyKnows(Object.keys(parsedFormula)[0].slice(4), worlds, relations)
        return (unionizedModel[world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'dist') {
        const intersectedModel = distributedKnowledge(Object.keys(parsedFormula)[0].slice(4), worlds, relations);
        return (intersectedModel[world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'cokn') {
        const commonKnowledgeModel = commonKnowledge(Object.keys(parsedFormula)[0].slice(4), worlds, relations);
        return (commonKnowledgeModel[world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }

    else { throw new Error('Invalid formula!') }
}

window.evaluateFormula = async function () {
    const start = Date.now()
    worlds = fromD3js(links, nodes)[0]
    console.log((worlds))
    relations = fromD3js(links, nodes)[1]
    console.log(relations)
    populateUnariesBinaries()
    const DELParser = new FormulaParser(variableKey, unaries, binaries)
    document.getElementById("result").innerHTML = ''
    const formula = document.getElementById("formula").value;
    try {
        document.getElementById("invalidprop").innerHTML = '';
        document.getElementById("true").innerHTML = "";
        document.getElementById("false").innerHTML = "";
        const parsedFormula = DELParser.parse(formula);

        for (const world of Object.keys(worlds)) {
            try {
                if (truth(world, worlds, relations, parsedFormula)) {
                    document.getElementById("result").innerHTML += `<span style='color:green'>Formula is true at world ${world}</span><br>`
                    document.getElementById("true").innerHTML += `w${world}<br>`
                    changeNodeColor(`${world}`, 'limegreen');
                } else {
                    document.getElementById("result").innerHTML += `<span style='color:red'>Formula is false at world ${world}</span><br>`
                    document.getElementById("false").innerHTML += `w${world}<br>`
                    changeNodeColor(`${world}`, 'red');
                }
            }
            catch (error) { // if world is removed, formula is false
                document.getElementById("result").innerHTML += `<span style='color:red'>Formula is false at world ${world}</span><br>`
                document.getElementById("false").innerHTML += `w${world}<br>`
                changeNodeColor(`${world}`, 'red');
            }
        }
    } catch (error) { document.getElementById("invalidprop").innerHTML = "<span style='color:red'>Invalid formula!</span>" }
    const end = Date.now()
    console.log(`Execution time: ${end - start} ms`)

}


window.changeNodeColor = async function (node, color) {
    svg.select(`#w${node}`)
        .style('fill', color)
    console.log(`#w${node}`)
}
// // Remove worlds
window.drawAnnouncedModel = async function () {
    worlds = fromD3js(links, nodes)[0];
    relations = fromD3js(links, nodes)[1];
    populateUnariesBinaries();
    const DELParser = new FormulaParser(variableKey, unaries, binaries);
    const formula = document.getElementById("formula").value;
    const parsedFormula = DELParser.parse(formula);
    const announcedModel = publicAnnouncement(parsedFormula, worlds, relations);
    relations = announcedModel[1];
    const removedWorlds = Object.keys(worlds).filter(w => !Object.keys(announcedModel[0]).includes(w));
    worlds = announcedModel[0];
    for (const world of removedWorlds) {
        removeNode(world)
    }
}

window.drawCommunicatedModel = async function () {
    worlds = fromD3js(links, nodes)[0];
    relations = fromD3js(links, nodes)[1];
    populateUnariesBinaries();
    const DELParser = new FormulaParser(variableKey, unaries, binaries); //not needed?
    try {
        document.getElementById("agenterror").innerHTML = ""
        const communicatingAgents = document.getElementById("communicatingAgents").value;
        console.log(communicatingAgents)
        let result = publicCommunication(Object.keys(relations), communicatingAgents, worlds, relations);
        relations = result[0]
        let difference = result[1]
        removeLinks(difference)
    } catch (error) { document.getElementById("agenterror").innerHTML = " Invalid input! Maybe you entered a non-existing agent?" }

}

window.downloadJSON = async function (args) {
    const model = { 'links': links, 'nodes': nodes }
    let data, filename, link;
    let json = 'data:text/json;charset=utf-8,' + JSON.stringify(model);
    filename = args.filename || 'export.json';
    data = encodeURI(json);
    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
}


export { relations, truth, worlds }



