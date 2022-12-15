import { worlds, relations } from "./parser_test.js";


function cartesian(reflexive) {
    let cartesianRelations = new Object();
    for (const world of Object.keys(worlds)) {
        cartesianRelations[world] = new Array();
    }
    if (reflexive === true) {
        for (const world of Object.keys(worlds)) {
            cartesianRelations[world] = Object.keys(worlds).map(w => parseInt(w));
        }
    } else {
        for (const world of Object.keys(worlds)) {
            cartesianRelations[world] = Object.keys(worlds).filter(w => w !== world).map(w => parseInt(w));
        }
    }
    return cartesianRelations;
}

export { cartesian };