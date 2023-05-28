import { relations } from "./parser_test.js";
import { fromD3js } from "./toD3Data.js";
import { forcedTransitions } from "./forcedProperties.js";

// set up SVG for D3
const width = 960;
const height = 500;
const colors = d3.scaleOrdinal(d3.schemeCategory10);
let currentAgent = "a";
//function setAgent(agent) 
window.setAgent = async function (agent) {
  currentAgent = agent;
  console.log(currentAgent)
  return currentAgent;
}
const svg = d3.select('#graph')
  .append('svg')
  .on('contextmenu', () => { d3.event.preventDefault(); })
  .attr('width', width)
  .attr('height', height);

const text = svg.append('text')

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.

let nodes = [
  { id: 0, vals: 'pq', reflexive: true },
  { id: 1, vals: 'q', reflexive: true },
  { id: 2, vals: 'p', reflexive: true },
  // { id: 3, vals: 'pqr', reflexive: true },
  // { id: 4, vals: 'qr', reflexive: true },
  // { id: 5, vals: 'pr', reflexive: true },
  // { id: 6, vals: 'r', reflexive: true },
  // { id: 7, vals: '', reflexive: true }

];

let links = [
  { source: nodes[0], target: nodes[1], left: false, right: true, id: "a-0-1" },

  //{ source: nodes[0], target: nodes[2], left: false, right: true, id: "b02" },

  // { source: nodes[0], target: nodes[3], left: true, right: true, id: "c03" },

  // { source: nodes[1], target: nodes[4], left: true, right: true, id: "c15" },

  // { source: nodes[1], target: nodes[7], left: true, right: true, id: "b17" },

  // { source: nodes[2], target: nodes[5], left: true, right: true, id: "c25" },

  // { source: nodes[2], target: nodes[7], left: true, right: true, id: "a27" },

  // { source: nodes[3], target: nodes[4], left: true, right: true, id: "a34" },

  // { source: nodes[3], target: nodes[5], left: true, right: true, id: "b35" },

  // { source: nodes[4], target: nodes[6], left: true, right: true, id: "b46" },

  // { source: nodes[5], target: nodes[6], left: true, right: true, id: "a56" },

  // { source: nodes[7], target: nodes[6], left: true, right: true, id: "c76" },


];
const uploadButton = document.querySelector('#uploadButton')
const uploadModel = document.querySelector('#inputmodel')
let rel;
uploadButton.addEventListener //(handleSubmit)
window.handleSubmit = async function () {
  if (!uploadModel.value.length) return;
  let modelReader = new FileReader();
  modelReader.onload = logFileRelations;
  rel = modelReader.readAsText(uploadModel.files[0]);

}

function logFileRelations(event) {
  let str = event.target.result;
  let json = JSON.parse(str);
  links = []
  nodes = []
  restart()
  links = json.links;
  console.log(links)
  nodes = json.nodes;
  for (const link of links) {
    link.source = nodes[link.source.id]
    link.target = nodes[link.target.id]
  }
  //populateUnariesBinaries()
  console.log(links)
  console.log(nodes)
  restart()
}
let lastNodeId = nodes.length;
fromD3js(links, nodes)
// init D3 force layout
const force = d3.forceSimulation()
  .force('link', d3.forceLink().id((d) => d.id).distance(150))
  .force('charge', d3.forceManyBody().strength(-500))
  .force('x', d3.forceX(width / 2))
  .force('y', d3.forceY(height / 2))
  .on('tick', tick);

// init D3 drag support
const drag = d3.drag()
  // Mac Firefox doesn't distinguish between left/right click when Ctrl is held... 
  .filter(() => d3.event.button === 0 || d3.event.button === 2)
  .on('start', (d) => {
    if (!d3.event.active) force.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  })
  .on('drag', (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  })
  .on('end', (d) => {
    if (!d3.event.active) force.alphaTarget(0);

    d.fx = null;
    d.fy = null;
  });

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
  .attr('id', 'end-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 6)
  .attr('markerWidth', 3)
  .attr('markerHeight', 3)
  .attr('orient', 'auto')
  .append('svg:path')
  .attr('d', 'M0,-5L10,0L0,5')
  .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
  .attr('id', 'start-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 4)
  .attr('markerWidth', 3)
  .attr('markerHeight', 3)
  .attr('orient', 'auto')
  .append('svg:path')
  .attr('d', 'M10,-5L0,0L10,5')
  .attr('fill', '#000');

// line displayed when dragging new nodes
const dragLine = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0')

//.attr('id', currentAgent)
// .attr('id', function () {
//   for (const agent of agents) {
//     if (document.getElementById(`${agent}`).checked) {
//       return document.getElementById(`${agent}`).value;
//     }
//   }
// })


// handles to link and node element groups
let path = svg.append('svg:g').selectAll('path');
let circle = svg.append('svg:g').selectAll('g');

//.attr("startOffset", "50%")
//.attr("stroke", "black")
//.attr("font-weight", lain")


// mouse event vars
let selectedNode = null;
let selectedLink = null;
let mousedownLink = null;
let mousedownNode = null;
let mouseupNode = null;

function resetMouseVars() {
  mousedownNode = null;
  mouseupNode = null;
  mousedownLink = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', (d) => {
    const deltaX = d.target.x - d.source.x;
    const deltaY = d.target.y - d.source.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normX = deltaX / dist;
    const normY = deltaY / dist;
    const sourcePadding = d.left ? 17 : 12;
    const targetPadding = d.right ? 17 : 12;
    const sourceX = d.source.x + (sourcePadding * normX);
    const sourceY = d.source.y + (sourcePadding * normY);
    const targetX = d.target.x - (targetPadding * normX);
    const targetY = d.target.y - (targetPadding * normY);

    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  });

  circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '');

  // remove old links
  path.exit().remove();
  let linkIDs = new Array()
  // add new links
  path = path.enter().append('svg:path')
    .attr('class', (d) => `link w${d.source.id} w${d.target.id}`)
    .attr('id', function (d) {
      `${d.id}-${d.source.id}-${d.target.id}`;
      linkIDs.push(`${d.id}`);
      return d.id;
    })
    .classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select link
      mousedownLink = d;
      selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;
      selectedNode = null;
      restart();
    })
    .merge(path)




  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, (d) => d.id);

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .classed('reflexive', (d) => d.reflexive);

  // remove old nodes
  circle.exit().remove();

  // add new nodes
  const g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('id', (d) => `w${d.id}`)
    .attr('r', 12)
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .style('stroke', (d) => d3.rgb(colors(d.id)).darker().toString())
    .classed('reflexive', (d) => d.reflexive)
    .on('mouseover', function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select node
      mousedownNode = d;
      selectedNode = (mousedownNode === selectedNode) ? null : mousedownNode;
      console.log(selectedNode)
      selectedLink = null;

      // reposition drag line
      dragLine
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`);

      restart();
    })
    .on('mouseup', function (d) {
      if (!mousedownNode) return;

      // needed by FF
      dragLine
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseupNode = d;
      if (mouseupNode === mousedownNode) {
        resetMouseVars();
        return;
      }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      const isRight = mousedownNode.id < mouseupNode.id;
      const source = isRight ? mousedownNode : mouseupNode;
      const target = isRight ? mouseupNode : mousedownNode;

      const link = links.filter((l) => l.source === source && l.target === target)[0];
      if (link && link.id[0] == currentAgent) {
        link[isRight ? 'right' : 'left'] = true;
      } else {
        if (source.id < target.id) {
          console.log(isRight)
          if (isRight) {
            links.push({
              source, target, left: !isRight, right: isRight, id: `${currentAgent}-${source.id}-${target.id}`
            })
          } else {
            links.push({
              source, target, left: !isRight, right: isRight, id: `${currentAgent}-${target.id}-${source.id}`
            })
          }
          // else {
          //   console.log(source.id);
          //   console.log(target.id)
          //   links.push({
          //     'source': target, 'target': source, left: !isRight, right: isRight, id: `${currentAgent + target.id + source.id}`
          //   })
          // }
        };
        console.log(source)
        console.log(links)


        // select new link
        selectedLink = link
        selectedNode = null;
        restart();
      }
    })

  // show node IDs
  g.append('svg:text')
    .attr('x', 0)
    .attr('y', 4)
    .attr('class', 'id')
    .attr('id', (d) => `tw${d.id}`)
    .text((d) => d.id)
    .style('fill', 'black')
  //.style('stroke-width', "0.5")

  // show node valuations
  g.append('svg:text')
    .attr('x', 0)
    .attr('y', 25)
    .attr('class', (d) => `w${d.id} text${d.id}`)
    .text((d) => d.vals)
    .style('fill', 'white')
  circle = g.merge(circle);

  for (const ID of linkIDs) {
    text.append("textPath")
      .attr("xlink:href", `#${ID}`)
      .attr("class", ID)
      .style("text-anchor", "middle")
      .style("fill", "red")
      .attr("startOffset", "50%")
      .text(`${ID[0]}`);
  }
  // Add some air between edge text and edge
  let dy = "-5 ".repeat(links.length)
  text.attr('dy', dy)

  // set the graph in motion

  force
    .nodes(nodes)
    .force('link').links(links);

  force.alphaTarget(0.3).restart();
}


function mousedown() {
  // because :active only works in WebKit?
  svg.classed('active', true);

  if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;

  // insert new node at point
  const point = d3.mouse(this);
  const node = { id: ++lastNodeId, vals: '', reflexive: false, x: point[0], y: point[1] };
  nodes.push(node);

  restart();
}

function mousemove() {
  if (!mousedownNode) return;

  // update drag line
  dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`);
}

function mouseup() {
  if (mousedownNode) {
    // hide drag line
    dragLine
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  const toSplice = links.filter((l) => l.source === node || l.target === node);
  for (const l of toSplice) {
    links.splice(links.indexOf(l), 1);
  }
}

// only respond once per keydown
let lastKeyDown = -1;

function keydown() {
  // d3.event.preventDefault();

  if (lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true);
    return;
  }

  if (!selectedNode && !selectedLink) return;

  switch (d3.event.keyCode) {
    //case 8: // backspace
    case 46: // delete
      if (selectedNode) {
        nodes.splice(nodes.indexOf(selectedNode), 1);
        spliceLinksForNode(selectedNode);
      } else if (selectedLink) {
        links.splice(links.indexOf(selectedLink), 1);
      }
      selectedLink = null;
      selectedNode = null;
      restart();
      break;
    case 66: // B
      if (selectedLink) {
        // set link direction to both left and right
        selectedLink.left = true;
        selectedLink.right = true;
      }
      restart();
      break;
    case 76: // L
      if (selectedLink) {
        // set link direction to left only
        selectedLink.left = true;
        selectedLink.right = false;
      }
      restart();
      break;
    case 82: // R
      if (selectedNode) {
        // toggle node reflexivity
        selectedNode.reflexive = !selectedNode.reflexive;
      } else if (selectedLink) {
        // set link direction to right only
        selectedLink.left = false;
        selectedLink.right = true;
      }
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.on('.drag', null);
    svg.classed('ctrl', false);
  }
}

window.addPropVar = async function () {
  let variable = document.getElementById("vals").value;
  if (!selectedNode) {
    document.getElementById("invalidprop").innerHTML = "No world selected!";
  } else {
    document.getElementById("invalidprop").innerHTML = "";
    for (const node of nodes) {
      if (selectedNode.id === node.id) {
        if (!node.vals.includes(variable)) {
          node.vals = node.vals + variable;
          svg.select(`.text${node.id}`)
            .text(node.vals);

        }
        else { document.getElementById("invalidprop").innerHTML = `${variable} already true in world ${selectedNode.id}!` }
      }
    }

  }
  console.log(nodes);
  restart()
}

window.removePropVar = async function () {
  let variable = document.getElementById("vals").value;
  if (!selectedNode) {
    document.getElementById("invalidprop").innerHTML = "No world selected!"
  } else {
    document.getElementById("invalidprop").innerHTML = "";
    for (const node of nodes) {
      if (selectedNode.id === node.id) {
        if (node.vals.includes(variable)) {
          node.vals = node.vals.replace(variable, '');
          svg.select(`.text${node.id}`)
            .text(node.vals);

        }
        else { document.getElementById("invalidprop").innerHTML = `${variable} already false in world ${selectedNode.id}!` }
      }
    }
  }
}
function removeNode(d) {
  let id = `w${d}`
  console.log(id)
  svg.selectAll(`#${id}`)
    .remove();
  svg.selectAll(`.${id}`)
    .remove()
  svg.selectAll(`#t${id}`)
    .remove()
  //svg.selectAll(`.${d}`)
  nodes = nodes.filter(n => n.id !== parseInt(d));
  links = links.filter(l => !(l.source.id == d || l.target.id == d));
  console.log(nodes)
}
function removeLinks(diffRelation) {
  let linksToBeRemoved = new Array();
  for (const agent of Object.keys(diffRelation)) {
    for (const world of Object.keys(diffRelation[agent])) {
      for (const successor of diffRelation[agent][world]) {
        linksToBeRemoved.push(`${agent}-${world}-${successor}`);
      }
    }
  }
  for (const link of linksToBeRemoved) {
    console.log(link)
    //console.log(text.select(`.${link}`))
    svg.select(`#${link}`)
      .remove();
    svg.select(`.${link}`)
      .remove()
  }
  links = links.filter(link => !linksToBeRemoved.includes(link.id))
}
function addForcedProperties(property) {
  for (const edge of forcedTransitions[property]) {
    if (property === "Symmetric") {
      let linkID = `${edge[0]}-${edge[2]}-${edge[1]}`
      for (const link of links) {
        if (linkID === link.id) {
          link.left = true;
          link.right = true;
        }
      }
    };
    if (property === "Reflexive") {
      for (const node of nodes) {
        if (node.id === parseInt(edge[1])) {
          node.reflexive = true;
        }
      }
    }
    if (property === "Transitive") {
      for (const edge of forcedTransitions[property]) {
        links.push({ source: nodes[edge[1]], target: nodes[edge[2]], left: false, right: true, id: `${edge[0]}-${edge[1]}-${edge[2]}` })
      }
    }
  }
  console.log(links)
  restart()

}
function removeForcedReflexivity() {
  const edgesToRemove = forcedTransitions["Reflexive"];
  for (const edge of edgesToRemove) {
    for (const node of nodes) {
      if (node.id === parseInt(edge[1])) {
        node.reflexive = false;
      }
    }
  }
  restart()
}
function removeForcedSymmetry() {
  const edgesToRemove = forcedTransitions["Symmetric"];
  for (const edge of edgesToRemove) {
    let linkID = `${edge[0]}-${edge[2]}-${edge[1]}`;
    for (const link of links) {
      if (linkID === link.id) {
        if (edge[2] > edge[1]) {
          link.right = false;
        } else if (edge[2] < edge[1]) {
          link.left = false;
        }
      }
    }
  }
  restart()
}
function removeTransitiveEdges() {
  const edgesToRemove = forcedTransitions["Transitive"];
  console.log("edges")
  console.log(forcedTransitions)
  for (const edge of edgesToRemove) {
    const edgeId = `${edge[0]}-${edge[1]}-${edge[2]}`;
    console.log(edgeId)
    for (const link of links) {
      if (link.id == edgeId) { links = links.filter(l => l !== link) }
    }
  }
  console.log(links);
  restart();
}



// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();

export { links, nodes, svg, removeNode, removeLinks, addForcedProperties, removeTransitiveEdges, removeForcedSymmetry, removeForcedReflexivity };