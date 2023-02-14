
import { FormulaParser } from "./formula-parser-es.js";
import { powerSet } from "./powerSetOfAgents.js";
import { forceReflexivity, forceSymmetry, forceTransitivity, forcedTransitions, removeForcedProperty } from "./forcedProperties.js";
import { publicAnnouncement } from "./dynamicOperations.js";
import { publicCommunication } from "./dynamicOperations.js";
import { cartesian, complement, inverse } from "./furtherModalities.js";
import { toD3js } from "./toD3Data.js";
import { everybodyKnows, distributedKnowledge, commonKnowledge } from "./groupNotions.js";
//import * as d3 from "./node_modules/d3/dist/d3.js";


// from https://github.com/rkirsling/modallogic/blob/master/js/MPL.js
let relations = new Object();
let worlds = new Object();
let modelLoaded = false;
//let data;
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
    console.log(unaries)
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
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'inac') {
        const complementModel = complement(worlds, relations);
        return (complementModel[Object.keys(parsedFormula)[0].slice(4)][world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'inve') {
        const inverseModel = inverse(worlds, relations);
        //console.log(inverseModel)
        //console.log(Object.keys(parsedFormula)[0].slice(4))
        return (inverseModel[Object.keys(parsedFormula)[0].slice(4)][world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
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



var svg = d3.select("svg");

var width = svg.attr("width");
var height = svg.attr("height");

svg = svg.call(d3.zoom().on("zoom", zoomed)).append("g");

svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 20)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#FF5733");

var color = d3.scaleOrdinal(d3.schemeCategory10);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));



//window.createGraph = async function (error) {
window.createGraph = async function (error) {
    if (error) throw error;
    let graph = toD3js(relations, worlds);
    console.log(graph);

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph['links'])
        .enter().append("line")
        //.attr("stroke", function (d) { return color(d.type); })
        .attr("stroke", "#FF5733")
        .attr("marker-end", "url(#arrow)");


    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", 20)
        .attr("fill", function (d) { if (d.root == "true") return color(d.root); return color(d.type); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    var text = svg.append("g").attr("class", "labels").selectAll("g")
        .data(graph.nodes)
        .enter().append("g");

    text.append("text")
        .attr("x", 30)
        .attr("y", ".31em")
        .style("font-family", "sans-serif")
        .style("font-size", "0.7em")
        .text(function (d) { return d.id; });

    text.append("text")
        .attr("x", -5)
        .attr("y", 0)
        .style("font-family", "sans-serif")
        .style("font-size", "0.7em")
        .text(function (d) { return d.prop; });


    node.on("click", function (d) {
        console.log("clicked", d.id);
    });


    node.append("title")
        .text(function (d) { return d.id; });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);


    function ticked() {
        link
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        node
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });

        text
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })


    }
}


function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function zoomed() {
    svg.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
}

const nodeColors = {
    null: "#00F7FF",
    true: "#64FF00",
    false: "#FF0000"
}
var data1 = {
    "nodes": [
        {
            "id": "Myriel",
            "type": 1
        },
        {
            "id": "Napoleon",
            "type": 1
        },
        {
            "id": "Mlle.Baptistine",
            "type": 1
        },
        {
            "id": "Mme.Magloire",
            "type": 1
        },
        {
            "id": "CountessdeLo",
            "type": 1
        },
        {
            "id": "Geborand",
            "type": 1
        },
        {
            "id": "Champtercier",
            "type": 1
        },
        {
            "id": "Cravatte",
            "type": 1
        },
        {
            "id": "Count",
            "type": 1
        },
        {
            "id": "OldMan",
            "type": 1
        },
        {
            "id": "Labarre",
            "type": 2
        },
        {
            "id": "Valjean",
            "type": 2
        },
        {
            "id": "Marguerite",
            "type": 3
        },
        {
            "id": "Mme.deR",
            "type": 2
        },
        {
            "id": "Isabeau",
            "type": 2
        },
        {
            "id": "Gervais",
            "type": 2
        },
        {
            "id": "Tholomyes",
            "type": 3
        },
        {
            "id": "Listolier",
            "type": 3
        },
        {
            "id": "Fameuil",
            "type": 3
        },
        {
            "id": "Blacheville",
            "type": 3
        },
        {
            "id": "Favourite",
            "type": 3
        },
        {
            "id": "Dahlia",
            "type": 3
        },
        {
            "id": "Zephine",
            "type": 3
        },
        {
            "id": "Fantine",
            "type": 3
        },
        {
            "id": "Mme.Thenardier",
            "type": 4
        },
        {
            "id": "Thenardier",
            "type": 4
        },
        {
            "id": "Cosette",
            "type": 5
        },
        {
            "id": "Javert",
            "type": 4
        },
        {
            "id": "Fauchelevent",
            "type": 0
        },
        {
            "id": "Bamatabois",
            "type": 2
        },
        {
            "id": "Perpetue",
            "type": 3
        },
        {
            "id": "Simplice",
            "type": 2
        },
        {
            "id": "Scaufflaire",
            "type": 2
        },
        {
            "id": "Woman1",
            "type": 2
        },
        {
            "id": "Judge",
            "type": 2
        },
        {
            "id": "Champmathieu",
            "type": 2
        },
        {
            "id": "Brevet",
            "type": 2
        },
        {
            "id": "Chenildieu",
            "type": 2
        },
        {
            "id": "Cochepaille",
            "type": 2
        },
        {
            "id": "Pontmercy",
            "type": 4
        },
        {
            "id": "Boulatruelle",
            "type": 6
        },
        {
            "id": "Eponine",
            "type": 4
        },
        {
            "id": "Anzelma",
            "type": 4
        },
        {
            "id": "Woman2",
            "type": 5
        },
        {
            "id": "MotherInnocent",
            "type": 0
        },
        {
            "id": "Gribier",
            "type": 0
        },
        {
            "id": "Jondrette",
            "type": 7
        },
        {
            "id": "Mme.Burgon",
            "type": 7
        },
        {
            "id": "Gavroche",
            "type": 8
        },
        {
            "id": "Gillenormand",
            "type": 5
        },
        {
            "id": "Magnon",
            "type": 5
        },
        {
            "id": "Mlle.Gillenormand",
            "type": 5
        },
        {
            "id": "Mme.Pontmercy",
            "type": 5
        },
        {
            "id": "Mlle.Vaubois",
            "type": 5
        },
        {
            "id": "Lt.Gillenormand",
            "type": 5
        },
        {
            "id": "Marius",
            "type": 8
        },
        {
            "id": "BaronessT",
            "type": 5
        },
        {
            "id": "Mabeuf",
            "type": 8
        },
        {
            "id": "Enjolras",
            "type": 8
        },
        {
            "id": "Combeferre",
            "type": 8
        },
        {
            "id": "Prouvaire",
            "type": 8
        },
        {
            "id": "Feuilly",
            "type": 8
        },
        {
            "id": "Courfeyrac",
            "type": 8
        },
        {
            "id": "Bahorel",
            "type": 8
        },
        {
            "id": "Bossuet",
            "type": 8
        },
        {
            "id": "Joly",
            "type": 8
        },
        {
            "id": "Grantaire",
            "type": 8
        },
        {
            "id": "MotherPlutarch",
            "type": 9
        },
        {
            "id": "Gueulemer",
            "type": 4
        },
        {
            "id": "Babet",
            "type": 4
        },
        {
            "id": "Claquesous",
            "type": 4
        },
        {
            "id": "Montparnasse",
            "type": 4
        },
        {
            "id": "Toussaint",
            "type": 5
        },
        {
            "id": "Child1",
            "type": 10
        },
        {
            "id": "Child2",
            "type": 10
        },
        {
            "id": "Brujon",
            "type": 4
        },
        {
            "id": "Mme.Hucheloup",
            "type": 8
        }
    ],
    "links": [
        {
            "source": "Napoleon",
            "target": "Myriel",
            "type": 1
        },
        {
            "source": "Mlle.Baptistine",
            "target": "Myriel",
            "type": 8
        },
        {
            "source": "Mme.Magloire",
            "target": "Myriel",
            "type": 10
        },
        {
            "source": "Mme.Magloire",
            "target": "Mlle.Baptistine",
            "type": 6
        },
        {
            "source": "CountessdeLo",
            "target": "Myriel",
            "type": 1
        },
        {
            "source": "Geborand",
            "target": "Myriel",
            "type": 1
        },
        {
            "source": "Champtercier",
            "target": "Myriel",
            "type": 1
        },
        {
            "source": "Cravatte",
            "target": "Myriel",
            "type": 1
        },
        {
            "source": "Count",
            "target": "Myriel",
            "type": 2
        },
        {
            "source": "OldMan",
            "target": "Myriel",
            "type": 1
        },
        {
            "source": "Valjean",
            "target": "Labarre",
            "type": 1
        },
        {
            "source": "Valjean",
            "target": "Mme.Magloire",
            "type": 3
        },
        {
            "source": "Valjean",
            "target": "Mlle.Baptistine",
            "type": 3
        },
        {
            "source": "Valjean",
            "target": "Myriel",
            "type": 5
        },
        {
            "source": "Marguerite",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Mme.deR",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Isabeau",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Gervais",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Listolier",
            "target": "Tholomyes",
            "type": 4
        },
        {
            "source": "Fameuil",
            "target": "Tholomyes",
            "type": 4
        },
        {
            "source": "Fameuil",
            "target": "Listolier",
            "type": 4
        },
        {
            "source": "Blacheville",
            "target": "Tholomyes",
            "type": 4
        },
        {
            "source": "Blacheville",
            "target": "Listolier",
            "type": 4
        },
        {
            "source": "Blacheville",
            "target": "Fameuil",
            "type": 4
        },
        {
            "source": "Favourite",
            "target": "Tholomyes",
            "type": 3
        },
        {
            "source": "Favourite",
            "target": "Listolier",
            "type": 3
        },
        {
            "source": "Favourite",
            "target": "Fameuil",
            "type": 3
        },
        {
            "source": "Favourite",
            "target": "Blacheville",
            "type": 4
        },
        {
            "source": "Dahlia",
            "target": "Tholomyes",
            "type": 3
        },
        {
            "source": "Dahlia",
            "target": "Listolier",
            "type": 3
        },
        {
            "source": "Dahlia",
            "target": "Fameuil",
            "type": 3
        },
        {
            "source": "Dahlia",
            "target": "Blacheville",
            "type": 3
        },
        {
            "source": "Dahlia",
            "target": "Favourite",
            "type": 5
        },
        {
            "source": "Zephine",
            "target": "Tholomyes",
            "type": 3
        },
        {
            "source": "Zephine",
            "target": "Listolier",
            "type": 3
        },
        {
            "source": "Zephine",
            "target": "Fameuil",
            "type": 3
        },
        {
            "source": "Zephine",
            "target": "Blacheville",
            "type": 3
        },
        {
            "source": "Zephine",
            "target": "Favourite",
            "type": 4
        },
        {
            "source": "Zephine",
            "target": "Dahlia",
            "type": 4
        },
        {
            "source": "Fantine",
            "target": "Tholomyes",
            "type": 3
        },
        {
            "source": "Fantine",
            "target": "Listolier",
            "type": 3
        },
        {
            "source": "Fantine",
            "target": "Fameuil",
            "type": 3
        },
        {
            "source": "Fantine",
            "target": "Blacheville",
            "type": 3
        },
        {
            "source": "Fantine",
            "target": "Favourite",
            "type": 4
        },
        {
            "source": "Fantine",
            "target": "Dahlia",
            "type": 4
        },
        {
            "source": "Fantine",
            "target": "Zephine",
            "type": 4
        },
        {
            "source": "Fantine",
            "target": "Marguerite",
            "type": 2
        },
        {
            "source": "Fantine",
            "target": "Valjean",
            "type": 9
        },
        {
            "source": "Mme.Thenardier",
            "target": "Fantine",
            "type": 2
        },
        {
            "source": "Mme.Thenardier",
            "target": "Valjean",
            "type": 7
        },
        {
            "source": "Thenardier",
            "target": "Mme.Thenardier",
            "type": 13
        },
        {
            "source": "Thenardier",
            "target": "Fantine",
            "type": 1
        },
        {
            "source": "Thenardier",
            "target": "Valjean",
            "type": 12
        },
        {
            "source": "Cosette",
            "target": "Mme.Thenardier",
            "type": 4
        },
        {
            "source": "Cosette",
            "target": "Valjean",
            "type": 31
        },
        {
            "source": "Cosette",
            "target": "Tholomyes",
            "type": 1
        },
        {
            "source": "Cosette",
            "target": "Thenardier",
            "type": 1
        },
        {
            "source": "Javert",
            "target": "Valjean",
            "type": 17
        },
        {
            "source": "Javert",
            "target": "Fantine",
            "type": 5
        },
        {
            "source": "Javert",
            "target": "Thenardier",
            "type": 5
        },
        {
            "source": "Javert",
            "target": "Mme.Thenardier",
            "type": 1
        },
        {
            "source": "Javert",
            "target": "Cosette",
            "type": 1
        },
        {
            "source": "Fauchelevent",
            "target": "Valjean",
            "type": 8
        },
        {
            "source": "Fauchelevent",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "Bamatabois",
            "target": "Fantine",
            "type": 1
        },
        {
            "source": "Bamatabois",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "Bamatabois",
            "target": "Valjean",
            "type": 2
        },
        {
            "source": "Perpetue",
            "target": "Fantine",
            "type": 1
        },
        {
            "source": "Simplice",
            "target": "Perpetue",
            "type": 2
        },
        {
            "source": "Simplice",
            "target": "Valjean",
            "type": 3
        },
        {
            "source": "Simplice",
            "target": "Fantine",
            "type": 2
        },
        {
            "source": "Simplice",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "Scaufflaire",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Woman1",
            "target": "Valjean",
            "type": 2
        },
        {
            "source": "Woman1",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "Judge",
            "target": "Valjean",
            "type": 3
        },
        {
            "source": "Judge",
            "target": "Bamatabois",
            "type": 2
        },
        {
            "source": "Champmathieu",
            "target": "Valjean",
            "type": 3
        },
        {
            "source": "Champmathieu",
            "target": "Judge",
            "type": 3
        },
        {
            "source": "Champmathieu",
            "target": "Bamatabois",
            "type": 2
        },
        {
            "source": "Brevet",
            "target": "Judge",
            "type": 2
        },
        {
            "source": "Brevet",
            "target": "Champmathieu",
            "type": 2
        },
        {
            "source": "Brevet",
            "target": "Valjean",
            "type": 2
        },
        {
            "source": "Brevet",
            "target": "Bamatabois",
            "type": 1
        },
        {
            "source": "Chenildieu",
            "target": "Judge",
            "type": 2
        },
        {
            "source": "Chenildieu",
            "target": "Champmathieu",
            "type": 2
        },
        {
            "source": "Chenildieu",
            "target": "Brevet",
            "type": 2
        },
        {
            "source": "Chenildieu",
            "target": "Valjean",
            "type": 2
        },
        {
            "source": "Chenildieu",
            "target": "Bamatabois",
            "type": 1
        },
        {
            "source": "Cochepaille",
            "target": "Judge",
            "type": 2
        },
        {
            "source": "Cochepaille",
            "target": "Champmathieu",
            "type": 2
        },
        {
            "source": "Cochepaille",
            "target": "Brevet",
            "type": 2
        },
        {
            "source": "Cochepaille",
            "target": "Chenildieu",
            "type": 2
        },
        {
            "source": "Cochepaille",
            "target": "Valjean",
            "type": 2
        },
        {
            "source": "Cochepaille",
            "target": "Bamatabois",
            "type": 1
        },
        {
            "source": "Pontmercy",
            "target": "Thenardier",
            "type": 1
        },
        {
            "source": "Boulatruelle",
            "target": "Thenardier",
            "type": 1
        },
        {
            "source": "Eponine",
            "target": "Mme.Thenardier",
            "type": 2
        },
        {
            "source": "Eponine",
            "target": "Thenardier",
            "type": 3
        },
        {
            "source": "Anzelma",
            "target": "Eponine",
            "type": 2
        },
        {
            "source": "Anzelma",
            "target": "Thenardier",
            "type": 2
        },
        {
            "source": "Anzelma",
            "target": "Mme.Thenardier",
            "type": 1
        },
        {
            "source": "Woman2",
            "target": "Valjean",
            "type": 3
        },
        {
            "source": "Woman2",
            "target": "Cosette",
            "type": 1
        },
        {
            "source": "Woman2",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "MotherInnocent",
            "target": "Fauchelevent",
            "type": 3
        },
        {
            "source": "MotherInnocent",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Gribier",
            "target": "Fauchelevent",
            "type": 2
        },
        {
            "source": "Mme.Burgon",
            "target": "Jondrette",
            "type": 1
        },
        {
            "source": "Gavroche",
            "target": "Mme.Burgon",
            "type": 2
        },
        {
            "source": "Gavroche",
            "target": "Thenardier",
            "type": 1
        },
        {
            "source": "Gavroche",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "Gavroche",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Gillenormand",
            "target": "Cosette",
            "type": 3
        },
        {
            "source": "Gillenormand",
            "target": "Valjean",
            "type": 2
        },
        {
            "source": "Magnon",
            "target": "Gillenormand",
            "type": 1
        },
        {
            "source": "Magnon",
            "target": "Mme.Thenardier",
            "type": 1
        },
        {
            "source": "Mlle.Gillenormand",
            "target": "Gillenormand",
            "type": 9
        },
        {
            "source": "Mlle.Gillenormand",
            "target": "Cosette",
            "type": 2
        },
        {
            "source": "Mlle.Gillenormand",
            "target": "Valjean",
            "type": 2
        },
        {
            "source": "Mme.Pontmercy",
            "target": "Mlle.Gillenormand",
            "type": 1
        },
        {
            "source": "Mme.Pontmercy",
            "target": "Pontmercy",
            "type": 1
        },
        {
            "source": "Mlle.Vaubois",
            "target": "Mlle.Gillenormand",
            "type": 1
        },
        {
            "source": "Lt.Gillenormand",
            "target": "Mlle.Gillenormand",
            "type": 2
        },
        {
            "source": "Lt.Gillenormand",
            "target": "Gillenormand",
            "type": 1
        },
        {
            "source": "Lt.Gillenormand",
            "target": "Cosette",
            "type": 1
        },
        {
            "source": "Marius",
            "target": "Mlle.Gillenormand",
            "type": 6
        },
        {
            "source": "Marius",
            "target": "Gillenormand",
            "type": 12
        },
        {
            "source": "Marius",
            "target": "Pontmercy",
            "type": 1
        },
        {
            "source": "Marius",
            "target": "Lt.Gillenormand",
            "type": 1
        },
        {
            "source": "Marius",
            "target": "Cosette",
            "type": 21
        },
        {
            "source": "Marius",
            "target": "Valjean",
            "type": 19
        },
        {
            "source": "Marius",
            "target": "Tholomyes",
            "type": 1
        },
        {
            "source": "Marius",
            "target": "Thenardier",
            "type": 2
        },
        {
            "source": "Marius",
            "target": "Eponine",
            "type": 5
        },
        {
            "source": "Marius",
            "target": "Gavroche",
            "type": 4
        },
        {
            "source": "BaronessT",
            "target": "Gillenormand",
            "type": 1
        },
        {
            "source": "BaronessT",
            "target": "Marius",
            "type": 1
        },
        {
            "source": "Mabeuf",
            "target": "Marius",
            "type": 1
        },
        {
            "source": "Mabeuf",
            "target": "Eponine",
            "type": 1
        },
        {
            "source": "Mabeuf",
            "target": "Gavroche",
            "type": 1
        },
        {
            "source": "Enjolras",
            "target": "Marius",
            "type": 7
        },
        {
            "source": "Enjolras",
            "target": "Gavroche",
            "type": 7
        },
        {
            "source": "Enjolras",
            "target": "Javert",
            "type": 6
        },
        {
            "source": "Enjolras",
            "target": "Mabeuf",
            "type": 1
        },
        {
            "source": "Enjolras",
            "target": "Valjean",
            "type": 4
        },
        {
            "source": "Combeferre",
            "target": "Enjolras",
            "type": 15
        },
        {
            "source": "Combeferre",
            "target": "Marius",
            "type": 5
        },
        {
            "source": "Combeferre",
            "target": "Gavroche",
            "type": 6
        },
        {
            "source": "Combeferre",
            "target": "Mabeuf",
            "type": 2
        },
        {
            "source": "Prouvaire",
            "target": "Gavroche",
            "type": 1
        },
        {
            "source": "Prouvaire",
            "target": "Enjolras",
            "type": 4
        },
        {
            "source": "Prouvaire",
            "target": "Combeferre",
            "type": 2
        },
        {
            "source": "Feuilly",
            "target": "Gavroche",
            "type": 2
        },
        {
            "source": "Feuilly",
            "target": "Enjolras",
            "type": 6
        },
        {
            "source": "Feuilly",
            "target": "Prouvaire",
            "type": 2
        },
        {
            "source": "Feuilly",
            "target": "Combeferre",
            "type": 5
        },
        {
            "source": "Feuilly",
            "target": "Mabeuf",
            "type": 1
        },
        {
            "source": "Feuilly",
            "target": "Marius",
            "type": 1
        },
        {
            "source": "Courfeyrac",
            "target": "Marius",
            "type": 9
        },
        {
            "source": "Courfeyrac",
            "target": "Enjolras",
            "type": 17
        },
        {
            "source": "Courfeyrac",
            "target": "Combeferre",
            "type": 13
        },
        {
            "source": "Courfeyrac",
            "target": "Gavroche",
            "type": 7
        },
        {
            "source": "Courfeyrac",
            "target": "Mabeuf",
            "type": 2
        },
        {
            "source": "Courfeyrac",
            "target": "Eponine",
            "type": 1
        },
        {
            "source": "Courfeyrac",
            "target": "Feuilly",
            "type": 6
        },
        {
            "source": "Courfeyrac",
            "target": "Prouvaire",
            "type": 3
        },
        {
            "source": "Bahorel",
            "target": "Combeferre",
            "type": 5
        },
        {
            "source": "Bahorel",
            "target": "Gavroche",
            "type": 5
        },
        {
            "source": "Bahorel",
            "target": "Courfeyrac",
            "type": 6
        },
        {
            "source": "Bahorel",
            "target": "Mabeuf",
            "type": 2
        },
        {
            "source": "Bahorel",
            "target": "Enjolras",
            "type": 4
        },
        {
            "source": "Bahorel",
            "target": "Feuilly",
            "type": 3
        },
        {
            "source": "Bahorel",
            "target": "Prouvaire",
            "type": 2
        },
        {
            "source": "Bahorel",
            "target": "Marius",
            "type": 1
        },
        {
            "source": "Bossuet",
            "target": "Marius",
            "type": 5
        },
        {
            "source": "Bossuet",
            "target": "Courfeyrac",
            "type": 12
        },
        {
            "source": "Bossuet",
            "target": "Gavroche",
            "type": 5
        },
        {
            "source": "Bossuet",
            "target": "Bahorel",
            "type": 4
        },
        {
            "source": "Bossuet",
            "target": "Enjolras",
            "type": 10
        },
        {
            "source": "Bossuet",
            "target": "Feuilly",
            "type": 6
        },
        {
            "source": "Bossuet",
            "target": "Prouvaire",
            "type": 2
        },
        {
            "source": "Bossuet",
            "target": "Combeferre",
            "type": 9
        },
        {
            "source": "Bossuet",
            "target": "Mabeuf",
            "type": 1
        },
        {
            "source": "Bossuet",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Joly",
            "target": "Bahorel",
            "type": 5
        },
        {
            "source": "Joly",
            "target": "Bossuet",
            "type": 7
        },
        {
            "source": "Joly",
            "target": "Gavroche",
            "type": 3
        },
        {
            "source": "Joly",
            "target": "Courfeyrac",
            "type": 5
        },
        {
            "source": "Joly",
            "target": "Enjolras",
            "type": 5
        },
        {
            "source": "Joly",
            "target": "Feuilly",
            "type": 5
        },
        {
            "source": "Joly",
            "target": "Prouvaire",
            "type": 2
        },
        {
            "source": "Joly",
            "target": "Combeferre",
            "type": 5
        },
        {
            "source": "Joly",
            "target": "Mabeuf",
            "type": 1
        },
        {
            "source": "Joly",
            "target": "Marius",
            "type": 2
        },
        {
            "source": "Grantaire",
            "target": "Bossuet",
            "type": 3
        },
        {
            "source": "Grantaire",
            "target": "Enjolras",
            "type": 3
        },
        {
            "source": "Grantaire",
            "target": "Combeferre",
            "type": 1
        },
        {
            "source": "Grantaire",
            "target": "Courfeyrac",
            "type": 2
        },
        {
            "source": "Grantaire",
            "target": "Joly",
            "type": 2
        },
        {
            "source": "Grantaire",
            "target": "Gavroche",
            "type": 1
        },
        {
            "source": "Grantaire",
            "target": "Bahorel",
            "type": 1
        },
        {
            "source": "Grantaire",
            "target": "Feuilly",
            "type": 1
        },
        {
            "source": "Grantaire",
            "target": "Prouvaire",
            "type": 1
        },
        {
            "source": "MotherPlutarch",
            "target": "Mabeuf",
            "type": 3
        },
        {
            "source": "Gueulemer",
            "target": "Thenardier",
            "type": 5
        },
        {
            "source": "Gueulemer",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Gueulemer",
            "target": "Mme.Thenardier",
            "type": 1
        },
        {
            "source": "Gueulemer",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "Gueulemer",
            "target": "Gavroche",
            "type": 1
        },
        {
            "source": "Gueulemer",
            "target": "Eponine",
            "type": 1
        },
        {
            "source": "Babet",
            "target": "Thenardier",
            "type": 6
        },
        {
            "source": "Babet",
            "target": "Gueulemer",
            "type": 6
        },
        {
            "source": "Babet",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Babet",
            "target": "Mme.Thenardier",
            "type": 1
        },
        {
            "source": "Babet",
            "target": "Javert",
            "type": 2
        },
        {
            "source": "Babet",
            "target": "Gavroche",
            "type": 1
        },
        {
            "source": "Babet",
            "target": "Eponine",
            "type": 1
        },
        {
            "source": "Claquesous",
            "target": "Thenardier",
            "type": 4
        },
        {
            "source": "Claquesous",
            "target": "Babet",
            "type": 4
        },
        {
            "source": "Claquesous",
            "target": "Gueulemer",
            "type": 4
        },
        {
            "source": "Claquesous",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Claquesous",
            "target": "Mme.Thenardier",
            "type": 1
        },
        {
            "source": "Claquesous",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "Claquesous",
            "target": "Eponine",
            "type": 1
        },
        {
            "source": "Claquesous",
            "target": "Enjolras",
            "type": 1
        },
        {
            "source": "Montparnasse",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "Montparnasse",
            "target": "Babet",
            "type": 2
        },
        {
            "source": "Montparnasse",
            "target": "Gueulemer",
            "type": 2
        },
        {
            "source": "Montparnasse",
            "target": "Claquesous",
            "type": 2
        },
        {
            "source": "Montparnasse",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Montparnasse",
            "target": "Gavroche",
            "type": 1
        },
        {
            "source": "Montparnasse",
            "target": "Eponine",
            "type": 1
        },
        {
            "source": "Montparnasse",
            "target": "Thenardier",
            "type": 1
        },
        {
            "source": "Toussaint",
            "target": "Cosette",
            "type": 2
        },
        {
            "source": "Toussaint",
            "target": "Javert",
            "type": 1
        },
        {
            "source": "Toussaint",
            "target": "Valjean",
            "type": 1
        },
        {
            "source": "Child1",
            "target": "Gavroche",
            "type": 2
        },
        {
            "source": "Child2",
            "target": "Gavroche",
            "type": 2
        },
        {
            "source": "Child2",
            "target": "Child1",
            "type": 3
        },
        {
            "source": "Brujon",
            "target": "Babet",
            "type": 3
        },
        {
            "source": "Brujon",
            "target": "Gueulemer",
            "type": 3
        },
        {
            "source": "Brujon",
            "target": "Thenardier",
            "type": 3
        },
        {
            "source": "Brujon",
            "target": "Gavroche",
            "type": 1
        },
        {
            "source": "Brujon",
            "target": "Eponine",
            "type": 1
        },
        {
            "source": "Brujon",
            "target": "Claquesous",
            "type": 1
        },
        {
            "source": "Brujon",
            "target": "Montparnasse",
            "type": 1
        },
        {
            "source": "Mme.Hucheloup",
            "target": "Bossuet",
            "type": 1
        },
        {
            "source": "Mme.Hucheloup",
            "target": "Joly",
            "type": 1
        },
        {
            "source": "Mme.Hucheloup",
            "target": "Grantaire",
            "type": 1
        },
        {
            "source": "Mme.Hucheloup",
            "target": "Bahorel",
            "type": 1
        },
        {
            "source": "Mme.Hucheloup",
            "target": "Courfeyrac",
            "type": 1
        },
        {
            "source": "Mme.Hucheloup",
            "target": "Gavroche",
            "type": 1
        },
        {
            "source": "Mme.Hucheloup",
            "target": "Enjolras",
            "type": 1
        }
    ]
};
createGraph(false);
export { relations, truth, worlds }



