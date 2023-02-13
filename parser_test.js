
import { FormulaParser } from "./formula-parser-es.js";
import { powerSet } from "./powerSetOfAgents.js";
import { forceReflexivity, forceSymmetry, forceTransitivity, forcedTransitions, removeForcedProperty } from "./forcedProperties.js";
import { publicAnnouncement } from "./dynamicOperations.js";
import { publicCommunication } from "./dynamicOperations.js";
import { cartesian, complement } from "./furtherModalities.js";
import { toD3js } from "./toD3Data.js";
import { everybodyKnows, distributedKnowledge, commonKnowledge } from "./groupNotions.js";
//import * as d3 from "./node_modules/d3/dist/d3.js";


// from https://github.com/rkirsling/modallogic/blob/master/js/MPL.js
let relations = new Object();
let worlds = new Object();
let modelLoaded = false;
let data;
const variableKey = 'prop';

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
    { symbol: '<|>', key: 'comp', precedence: 4 }

];


const binaries = [
    { symbol: '&', key: 'conj', precedence: 3, associativity: 'right' },
    { symbol: '|', key: 'disj', precedence: 2, associativity: 'right' },
    { symbol: '->', key: 'impl', precedence: 1, associativity: 'right' },
    { symbol: '<->', key: 'equi', precedence: 0, associativity: 'right' },
    { symbol: '[!]', key: 'ann', precedence: 4, associativity: 'right' }
];

let uploadButton = document.querySelector('#uploadButton')
let uploadRelations = document.querySelector('#inputrelations')
let uploadWorlds = document.querySelector('#inputworlds')


uploadButton.addEventListener //(handleSubmit)
window.handleSubmit = async function () {
    //event.preventDefault();
    if (!uploadRelations.value.length) return;
    if (!uploadWorlds.value.length) return;
    let relationsReader = new FileReader();
    let worldsReader = new FileReader();
    relationsReader.onload = logFileRelations;
    worldsReader.onload = logFileWorlds;
    relations = relationsReader.readAsText(uploadRelations.files[0]);
    worlds = worldsReader.readAsText(uploadWorlds.files[0]);
    modelLoaded = true;



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
        unaries.push({ symbol: `<>${agent}`, key: `poss${agent}`, precedence: 4 });
        unaries.push({ symbol: `<|>${agent}`, key: `comp${agent}`, precedence: 4 });
    }
    for (const agent of powerSet(agents)) {
        unaries.push({ symbol: `[C!]${agent}`, key: `comm${agent}`, precedence: 4 });
        unaries.push({ symbol: `EK${agent}`, key: `ekno${agent}`, precedence: 4 });
        unaries.push({ symbol: `DK${agent}`, key: `dist${agent}`, precedence: 4 });
        unaries.push({ symbol: `CK${agent}`, key: `cokn${agent}`, precedence: 4 });


    }
    console.log(worlds)



}


window.getModel = async function () {
    const name = document.getElementById("inputmodel").value;
    const model = JSON.parse(localStorage.getItem(`${name}`));
    relations = model['relations'];
    worlds = model['worlds'];


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
    //console.log(parsedFormula)
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
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'comm') {
        console.log(Object.keys(parsedFormula)[0].slice(4))
        console.log([...Object.keys(parsedFormula)[0].slice(4)].sort((a, b) => a.localeCompare(b)).join(""))
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
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'comp') {
        const complementModel = complement(worlds, relations);
        return (complementModel[Object.keys(parsedFormula)[0].slice(4)][world]).some(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'ekno') {
        const unionizedModel = everybodyKnows(Object.keys(parsedFormula)[0].slice(4), worlds, relations)
        //return truth(world, worlds, unionizedModel, parsedFormula[Object.keys(parsedFormula)[0]]);
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

    const DELParser = new FormulaParser(variableKey, unaries, binaries)
    document.getElementById("result").innerHTML = ''
    const formula = document.getElementById("formula").value;
    const evaluationPoint = parseInt(document.getElementById("evaluationPoint").value);
    const parsedFormula = DELParser.parse(formula);

    if (truth(evaluationPoint, worlds, relations, parsedFormula)) {
        document.getElementById("result").innerHTML += `<span style='color:green'>Formula is true at world ${evaluationPoint}</span><br>`
    } else {
        document.getElementById("result").innerHTML += `<span style='color:red'>Formula is false at world ${evaluationPoint}</span><br>`
    }

}
var margin = { top: 10, right: 30, bottom: 30, left: 40 },
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_graph")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    //.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")")



//d3.json(toD3js(relations, worlds), function (data) {


//d3(toD3js(relations, worlds), function (data) {
window.drawModel = async function () {
    data = toD3js(relations, worlds)
    console.log(data)


    console.log('draw')
    // Initialize the links
    var link = svg
        .selectAll(".links")
        .data(data["links"])
        .enter()
        .append("line")
        //.attr('marker-end', 'url(#arrowhead)')
        .style("stroke", "#aaa")
        .attr('marker-end', 'url(#arrowhead)')


    // Initialize the nodes
    var node = svg
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", 20)
        .style("fill", "#69b3a2")

    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', '13')
        //.attr('refY', '0')
        .attr('markerUnits', 'strokeWidth')
        .attr('markerWidth', '10')
        .attr('markerHeight', '10')
        .attr('orient', 'auto')
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999')

    // Let's list the force we wanna apply on the network
    var simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
        .force("link", d3.forceLink()                               // This force provides links between nodes
            .id(function (d) { return d.id; })                     // This provide  the id of a node
            .links(data.links)                                    // and this the list of links
        )
        .force("charge", d3.forceManyBody().strength(-400))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
        .on("end", ticked);

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
        link
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        node
            .attr("cx", function (d) { return d.x + 6; })
            .attr("cy", function (d) { return d.y - 6; });
    }
}
//});



export { relations, truth, worlds }



