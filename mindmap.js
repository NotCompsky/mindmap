"use strict";

const get_regexp_from_user_input_event = eventobj => {
	let str = eventobj.target.value; // see https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
	let regexp = null;
	if (str.length >= 2){
	let flags = "";
	if (str.charCodeAt(0) * str.charCodeAt(str.length-1) == 2209){ // "/".charCode == 47 which is a prime, 2209==49*49
		str = str.substr(1,str.length-2); // /foobar/ -> foobar  NOTE: /foo\/bar/ -> RegExp("foo\/bar") -> RegExp("foo/bar") due to JavaScript ignoring escapes on non-standard characters
	} else {
		flags = "i";
		str = str.trim(); // Remove whitespace at start and end
		
		for (let i = 0;  i < str.length;  ++i){
			const thischar = str.charCodeAt(i);
			if ((64 < thischar) && (thischar < 91)){ // str[i] in [A,Z]
				flags = "";
				if ((i+1 === str.length) || (
					(64 < str.charCodeAt(i+1)) && (str.charCodeAt(i+1) < 91)
				) || (
					str.charCodeAt(i+1) === 32 // space
				)){
					str = str.substr(0,i+1) + "[a-z]* ?" + str.substr(i+1);
					i += 8;
				}
			}
		}
	}
	try {
		regexp = new RegExp(str, flags);
	} catch(e){
		regexp = new RegExp(str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'), "i");
	}
	}
	return regexp;
};

const nodecontent = document.getElementById("nodecontent");
const nodecontent_checkbox = document.getElementById("nodecontent_checkbox");
const nodecontent_save = document.getElementById("nodecontent_save");
const nodecontent_createsibling_input = document.getElementById("nodecontent_createsibling_input");
const nodecontent_colourgroup_input = document.getElementById("nodecontent_colourgroup_input");
const nodecontent_parent_title = document.getElementById("nodecontent_parent_title");
const parent_changer_list = document.getElementById("parent_changer_list");
const children_list = document.getElementById("children_list");
const siblings_list = document.getElementById("siblings_list");
const siblings_adder_list = document.getElementById("siblings_adder_list");

const underlying_buffer2 = [
	0.00004,0,0,0, 0,0.00004,0,0, 0,0,1,0, 0,0,0,1, // graph__transformation_matrix
	
	
	
	0,0,0,0, // Hidden
	0,0,0,0,
	
	0.576,0.516,0.496,1,
	0.4,0.4,0.4,1, // Visible
	
	0.284,0.255,0.246,1,
	1,1,1,1, // Primary highlighted (clicked nodes)
	
	0.15,0.15,0.15,1,
	0.85,0.85,0.85,1, // Secondary highlighted (neighbours of primary)
	
	0.3,0.3,0.3,1,
	0.7,0.7,0.7,1, // Tertiary highlighted (hovered nodes)
	
	0.45,0.45,0.45,1,
	0.55,0.55,0.55,1, // Quartiary highlighted (neighbours of hovered)
	
	//0.282,0.525,0.831,1, // 'green globe' theme for worldmap: ocean
	//0.200,0.373,0.588,1,
	0.302,0.506,0.149,1, // 'green globe' theme for worldmap: ocean
	0.220,0.365,0.200,1,
	0.200,0.373,0.588,1,
	0.180,0.263,0.365,1,
	
	1,1,1,1, // Wipe the screen (or, temporarily, the nodes' outline)
	0,0,0,1,
	
	// Formerly all_chart_colours_vec4: // TODO: More? // Need at least 11 (search engines)
	0.902, 0.624, 0.0,   1.0,
	0.902, 0.624, 0.0,   1.0,
	0.337, 0.706, 0.914, 1.0,
	0.337, 0.706, 0.914, 1.0,
	0.0,   0.62,  0.451, 1.0,
	0.0,   0.62,  0.451, 1.0,
	0.0,   0.447, 0.698, 1.0,
	0.0,   0.447, 0.698, 1.0,
	0.835, 0.369, 0.0,   1.0,
	0.835, 0.369, 0.0,   1.0,
	0.8,   0.475, 0.655, 1.0,
	0.8,   0.475, 0.655, 1.0,
	0.941, 0.894, 0.259, 1.0, // 7
	0.941, 0.894, 0.259, 1.0,
	0.494, 0.49,  0.502, 1.0, // From tagem/svgedit.js
	0.494, 0.49,  0.502, 1.0,
	0.49,  0.2,   0.404, 1.0, // From tagem/svgedit.js but each RGB incremented by 16 (1 top character)
	0.49,  0.2,   0.404, 1.0,
	0.635, 0.388, 0.82,  1.0, // From tagem/svgedit.js
	0.635, 0.388, 0.82,  1.0,
	0.78,  0.647, 0.871, 1.0, // From tagem/svgedit.js
	0.78,  0.647, 0.871, 1.0,
	
	1,0,0,1, // TODO: Maybe replace this with a good chart colour. Or maybe red is needed?
	1,0,0,1,
	0,0,1,1, //
	0,0,1,1,
	0.518,0.726,0.475,1, // custom made in GIMP
	0,1,0,1,
	1,0,1,1,
	1,0,1,1,
	0.5,0,0,1,
	0.5,0,0,1,
	0.343,0.775,0.897,1, // custom made in GIMP
	0,1,1,1,
];


const load_shader = (gl, type, source) => {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	return shader;
};
const init_graph = (gl, vertexShader_src, fragmentShader_src) => {
	const vertexShader = load_shader(gl, gl.VERTEX_SHADER, vertexShader_src);
	const fragmentShader = load_shader(gl, gl.FRAGMENT_SHADER, fragmentShader_src);
	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.useProgram(program);
	return program;
};


const max_line_length = 50;

const save_btn = document.getElementById("save_btn");
const copy_btn = document.getElementById("copy_btn");

save_btn.addEventListener("pointerup", () => {
	const file = new Blob([JSON.stringify([contents,all_parents,misc_connections,nodecolours,colours])], {type:"application/json"});
	const a = document.createElement("a");
	const url = URL.createObjectURL(file);
	a.href = url;
	a.download = "rpill.json";
	document.body.appendChild(a);
	a.click();
	save_btn.disabled = true;
	copy_btn.disabled = true;
	setTimeout(function(){
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 1);
});
copy_btn.addEventListener("pointerup", ()=>{
	navigator.clipboard.writeText(JSON.stringify([contents,all_parents,misc_connections,nodecolours,colours]));
});
document.getElementById("find_btn").addEventListener("pointerup", () => {
	const s = prompt("Pattern");
	const pattern = new RegExp(s);
	const tohighlightnodes = [];
	for (let i = 0;  i < contents.length;  ++i){
		if (contents[i].match(pattern) !== null){
			let nodeindx = i;
			while(true){
				if (nodeindx === 0)
					break;
				tohighlightnodes.push(nodeindx);
				nodeindx = all_parents[nodeindx-1];
			}
		}
	}
	highlight_intersect(tohighlightnodes, 0);
	draw_graph_frame();
});
const fileinput_btn = document.getElementById("fileinput");
const title_from_content = content => {
	content = content.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(/  +/g," ").replaceAll(/[^\n A-Za-z0-9(),'/&-]/g,"");
	let newline_indx = content.indexOf("\n")
	if (newline_indx === -1)
		newline_indx = content.length;
	if (newline_indx > max_line_length)
		newline_indx = max_line_length;
	return content.substr(0,newline_indx);
};




const process_node = (size, depth, angle_offset, angle_step, x, y, d, this_node_indx, parent_node_indx) => {
	const sub_node_indices = d[this_node_indx];
	const n_children = sub_node_indices.length;
	
	all_graph_nodes__xyr[this_node_indx*3  ] = 100000.0*x;
	all_graph_nodes__xyr[this_node_indx*3+1] = 100000.0*y;
	all_graph_nodes__xyr[this_node_indx*3+2] = 10000.0*size;
	
	if (n_children !== 0){
		let angle_offset_sub = angle_offset;
		let angle_step_sub = angle_step/n_children;
		let skip_ith_anglerange = -1;
		if (depth === 1){
			/// avoid top and bottom
			angle_step_sub = angle_step/(n_children+8);
			angle_offset_sub = angle_offset + 2.0*angle_step_sub;
			skip_ith_anglerange = n_children>>1;
		}
		let prev_ysub = null;
		let is_y_increasing = 2.0;
		const size_sub = size/n_children;
		const distance_from_root_sub = Math.sqrt(x*x + y*y) + 4.0*size_sub;
		for (let i = 0;  i < sub_node_indices.length;  ++i){
			const sub_node_indx = sub_node_indices[i];
			if (i === skip_ith_anglerange)
				angle_offset_sub += 4.0*angle_step_sub;
			if (sub_node_indx === parent_node_indx)
				continue;
			const x_sub = distance_from_root_sub*Math.sin(angle_offset_sub);
			let y_sub = distance_from_root_sub*Math.cos(angle_offset_sub); // Begin at top, ensuring each 
			if ((prev_ysub !== null) && (depth > 2)){
				if (is_y_increasing === 2.0){
					is_y_increasing = 1 - ((y_sub<prev_ysub)<<1);
				}
				const text_size_sub = size_sub*0.2;
				if ((is_y_increasing*prev_ysub < is_y_increasing*y_sub) && (is_y_increasing*y_sub < is_y_increasing*(prev_ysub+is_y_increasing*text_size_sub)))
					y_sub += is_y_increasing*text_size_sub;
				/*
				((is_y_increasing*prev_ysub < is_y_increasing*y_sub) && (is_y_increasing*y_sub < is_y_increasing*(prev_ysub+is_y_increasing*text_size_sub)))  is equivalent to:
				if (is_y_increasing === 1){
					if ((prev_ysub < y_sub) && (y_sub < (prev_ysub+text_size_sub)))
						y_sub = prev_ysub + text_size_sub;
				} else {
					if ((prev_ysub >= y_sub) && (y_sub >= prev_ysub-text_size_sub))
						y_sub = prev_ysub - text_size_sub;
				}
				*/
			}
			process_node(size_sub, depth+1, angle_offset_sub, angle_step_sub, x_sub, y_sub, d, sub_node_indx, this_node_indx);
			angle_offset_sub += angle_step_sub;
			prev_ysub = y_sub;
		}
	}
};


let spare_allgraphnodesxyr_space = 0;

fileinput_btn.addEventListener("input", e => {
	const file = e.target.files[0];
	if (file){
		fileinput_btn.disabled = true;
		const reader = new FileReader();
		reader.addEventListener("load", (ee) => {
			[contents, all_parents, misc_connections, nodecolours, colours] = JSON.parse(ee.target.result);
			
			spare_allgraphnodesxyr_space = 300;
			all_graph_nodes__xyr = new Float32Array(all_parents.length*3 + 3 + spare_allgraphnodesxyr_space);
			
			connectionses.length = all_parents.length+1;
			connectionses[0].length = 0;
			for (let i = 0;  i < all_parents.length;  ++i)
				connectionses[i+1] = [all_parents[i]];
			for (let i = 0;  i < all_parents.length;  ++i)
				connectionses[all_parents[i]].push(i+1);
			process_node(1, 1, 0.0, 2.0*3.14152, 0.0, 0.0, connectionses, 0, 0);
			
			/*for (let i = 0;  i < misc_connections.length;  i+=2){
				connectionses[misc_connections[i  ]].push(misc_connections[i+1]);
				connectionses[misc_connections[i+1]].push(misc_connections[i  ]);
			}, equivalent to: */
			for (let i = 0;  i < misc_connections.length;  ++i){
				connectionses[misc_connections[i]].push(misc_connections[i + 1 - ((i&1)<<1)]);
			}
			
			all_titles = new Array(contents.length);
			for (let i = 0;  i < contents.length;  ++i){
				all_titles[i] = title_from_content(contents[i]);
			}
			
			process_entries();
			
			fileinput_btn.disabled = false;
			
			draw_graph_frame_or_polygon_replacement();
			
			save_btn.disabled = true;
			copy_btn.disabled = true;
		});
		reader.readAsText(file);
	}
});

var all_titles = ["ROOT","Example"];
var contents = ["ROOT\nRight click this node to add children","Example"];
var all_parents = [0];
var misc_connections = [];
const connectionses = [[1],[0]];
var nodecolours = [0,0];
var colours = ["#ff0000"];
var all_graph_nodes__xyr = new Float32Array([0.0,0.0,1000.0, 2000.0,2000.0,1000.0]);

function process_entries(){
	n_graph_edges = all_parents.length + (misc_connections.length>>1);
	
	if (n_graph_edges * 2 > all_graph_edges__ab.length){
		all_graph_edges__xyr = new Float32Array(n_graph_edges * graph__edges__elements_per_edge);
		all_graph_edges__ab  = new Int32Array(n_graph_edges * 2); // Connected node IDs
	}
	
	/*for (let i = 0;  i < all_entries.length;  ++i){
		all_graph_nodes__xyr[3*i+0] = all_entries[i].x;
		all_graph_nodes__xyr[3*i+1] = all_entries[i].y;
		all_graph_nodes__xyr[3*i+2] = all_entries[i].r;
	}*/
	
	let all_graph_edges__indx = 0;
	for (let i = 1; i <= all_parents.length;  ++i){
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx  ] = all_graph_nodes__xyr[3*i];
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx+1] = all_graph_nodes__xyr[3*all_parents[i-1]];
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx+2] = all_graph_nodes__xyr[3*i+1];
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx+3] = all_graph_nodes__xyr[3*all_parents[i-1]+1];
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx+4] = graph__line_width_given_node_radii(all_graph_nodes__xyr[3*i+2], all_graph_nodes__xyr[3*all_parents[i-1]+2]);
				
				all_graph_edges__ab[2*all_graph_edges__indx  ] = i;
				all_graph_edges__ab[2*all_graph_edges__indx+1] = all_parents[i-1];
				
				++all_graph_edges__indx;
	}
	for (let i = 0;  i < misc_connections.length;  i+=2){
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx  ] = all_graph_nodes__xyr[3*misc_connections[i]];
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx+1] = all_graph_nodes__xyr[3*misc_connections[i+1]];
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx+2] = all_graph_nodes__xyr[3*misc_connections[i]+1];
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx+3] = all_graph_nodes__xyr[3*misc_connections[i+1]+1];
				all_graph_edges__xyr[graph__edges__elements_per_edge*all_graph_edges__indx+4] = graph__line_width_given_node_radii(all_graph_nodes__xyr[3*i+2], all_graph_nodes__xyr[3*misc_connections[i+1]+2]);
				
				all_graph_edges__ab[2*all_graph_edges__indx  ] = misc_connections[i];
				all_graph_edges__ab[2*all_graph_edges__indx+1] = misc_connections[i+1];
				
				++all_graph_edges__indx;
	}
	
	for (let i = 0;  i < all_graph_nodes__edges.length;  ++i)
		all_graph_nodes__edges[i].length = 0;
	for (let i = all_graph_nodes__edges.length;  i <= all_parents.length;  ++i)
		all_graph_nodes__edges.push([]);
	all_graph_nodes__edges.length = all_parents.length+1; // Remove excess if they exist
	
	let edge_indx = 0;
	for (let i = 1;  i <= all_parents.length;  ++i){
				all_graph_nodes__edges[i].push(edge_indx);
				all_graph_nodes__edges[all_parents[i-1]].push(edge_indx);
				++edge_indx;
	}
	for (let i = 0;  i < misc_connections.length;  i+=2){
				all_graph_nodes__edges[misc_connections[i  ]].push(edge_indx);
				all_graph_nodes__edges[misc_connections[i+1]].push(edge_indx);
				++edge_indx;
	}
	
	let graph__1st_and_2nd_most_neighbours = 0;
	for (let x of connectionses){
		if (x.length > graph__1st_and_2nd_most_neighbours)
			graph__1st_and_2nd_most_neighbours = x.length;
	}
	graph__1st_and_2nd_most_neighbours *= 2; // lazy, instead of getting 2nd most neighbours value too
	
	{ // allocate_graph_webgl_memory	
		const total_nodes = connectionses.length + graph__1st_and_2nd_most_neighbours;
		const total_edges = n_graph_edges + graph__1st_and_2nd_most_neighbours;
		
		if (all_graph_nodes__colours.length < 24 * total_nodes + 6 * total_edges){
			if (graph_gl__a_nodepositionmatrices_buf !== null){
				graph_gl.deleteBuffer(graph_gl__a_nodepositionmatrices_buf);
				graph_gl.deleteBuffer(graph_gl__a_nodecolours_buf);
			}
			graph_gl__a_nodepositionmatrices_buf = graph_gl.createBuffer();
			graph_gl.bindBuffer(graph_gl.ARRAY_BUFFER, graph_gl__a_nodepositionmatrices_buf);
			graph_gl.bufferData(graph_gl.ARRAY_BUFFER, 192 * total_nodes + 48 * total_edges, graph_gl.DYNAMIC_DRAW); // Preallocate. 8 == sizeof(vec2) == sizeof(float) * 2, and 4 vec2 per node
			
			graph_gl__a_nodecolours_buf = graph_gl.createBuffer();
			graph_gl.bindBuffer(graph_gl.ARRAY_BUFFER, graph_gl__a_nodecolours_buf);
			graph_gl.bufferData(graph_gl.ARRAY_BUFFER, 384 * total_nodes + 96 * total_edges, graph_gl.DYNAMIC_DRAW); // Preallocate. 16 == sizeof(vec4) == sizeof(float) * 4, and 4 triangles per node, 3 colours per triangle
			
			all_graph_nodes__matrixmults = new Float32Array(48 * total_nodes + 12 * total_edges).fill(0); // 12 vec2 for each node (4 triangles)
			all_graph_nodes__colours = new Float32Array(24 * total_nodes + 6 * total_edges).fill(0); // one colour per vertex
		}
		
		let matrix_indx = 0;
		for (let i = 0;  i < n_graph_edges;  ++i, matrix_indx+=12){
			update_graph_edge_coord__webgl(matrix_indx, i);
		}
		for (let i = 0;  i < connectionses.length;  ++i, matrix_indx+=48){
			update_graph_node_coord__webgl(matrix_indx, i);
		}
		set_graph_node_coords(all_graph_nodes__matrixmults);
	}
	
	graph__reset_node_colours();
}



var currently_displaying_node_indx = -1;


let d3__svg__clickedat_x;
let d3__svg__clickedat_y;

const sqrt3_div2 = 0.866;
const sqrt3_div2_inverse = 1.1547;
var graph_canvas_width = 0;
var graph_canvas_height = 0; // TODO: If the canvas is staying as a square, replace all references of height with width
const graph__edges__indx__x1 = 0;
const graph__edges__indx__x2 = 1;
const graph__edges__indx__y1 = 2;
const graph__edges__indx__y2 = 3;
const graph__edges__indx__r  = 4;
const graph__edges__elements_per_edge = 5;

var n_extra_graph_triangles_to_render = 0;

 // TODO: Hide vertices based on category membership

// NOTE: If we want to allow nodes to be dynamically added, we cannot replace "all_graph_nodes__names.length" with the raw integer value
const graph__line_width_given_node_radii = (a, b) => {
	return ((a > b) ? b : a) / 4;
};
const all_graph_nodes__edges = [];
// NOTE: Cannot use fill() because it refers to the SAME object (so each element would point to the same array). Would use .fill(0).map(x => []) except it HALVES the FPS (probably because it tricks the compiler into optimising for an integer array)
var n_graph_edges = 0;
var all_graph_edges__xyr;
var all_graph_edges__ab = new Int32Array(0); // for length property
let d3__currently_selected = null;

const dl_text_as_file = (filename, text) => {
	const a = document.createElement("a");
	a.href = URL.createObjectURL(new Blob([text], {type: "text/plain"}));
	a.download = filename;
	a.hidden = true;
	document.body.appendChild(a);
	a.click();
};

var all_graph_nodes__matrixmults;
var all_graph_nodes__colours = new Float32Array(0); // for length property
const graph__transformation_matrix = underlying_buffer2;

const get_canvas_coords_from_pointer_event = (eventobj) => {
	const rect = eventobj.currentTarget.getBoundingClientRect();
	// return [2*(eventobj.clientX - rect.left) / rect.width - 1,  2*(rect.top - eventobj.clientY) / rect.height + 1];
	return [2*eventobj.clientX / rect.width - 1,  -2*eventobj.clientY / rect.height + 1]; // NOTE: rect.top, rect.left are both guaranteed to be 0
};
const graph__get_coords_from_pointer_event = eventobj => {
	// return [(2*(eventobj.clientX - rect.left) / rect.width - 1 - graph__transformation_matrix[12]) / graph__transformation_matrix[0],  (2*(rect.top - eventobj.clientY) / rect.height + 1 - graph__transformation_matrix[13]) / graph__transformation_matrix[0]];
	return [(2*eventobj.clientX / graph_canvas_width - 1 - graph__transformation_matrix[12]) / graph__transformation_matrix[0],  (-2*eventobj.clientY / graph_canvas_height + 1 - graph__transformation_matrix[13]) / graph__transformation_matrix[5]]; // NOTE: rect.top, rect.left are both guaranteed to be 0
};

//const matrix_33_apply = (A, v) => [A[0]*v[0]+A[1]*v[1]+A[2]*v[2], A[3]*v[0]+A[4]*v[1]+A[5]*v[2], A[6]*v[0]+A[7]*v[1]+A[8]*v[2]];
//const matrix_33_apply_to_v2 = (A, x, y) => [A[0]*x+A[1]*y+A[2], A[3]*x+A[4]*y+A[5]]; // equiv to matrix_33_apply(A, [x,y,1])
const matrix_44_apply_to_v2 = (A, x, y) => [A[0]*x+A[4]*y+A[12], A[1]*x+A[5]*y+A[13]]; // NOTE: Assumes the default values are (x,y,0,1) like in WebGL - not (x,y,1) like in SVG

const node_containing_coords = (x,y) => {
	// Finds the node whose centre is closest, limited to those whose radius it is within
	let largest_distance_from_circle_edge = 1<<31;
	let closest_node = null;
	for (let i = 0;  i < connectionses.length;  ++i){
		const distance = (x - all_graph_nodes__xyr[3*i])**2 + (y - all_graph_nodes__xyr[3*i+1])**2 - all_graph_nodes__xyr[3*i+2]**2;
		if ((distance < 0) && (distance > largest_distance_from_circle_edge)){
			largest_distance_from_circle_edge = distance;
			closest_node = i;
		}
	}
	return closest_node;
};

var graph_gl_u_graphmatrixmult;
const set_graph_transformation = (scale, x, y) => {
	graph__transformation_matrix[0]  = scale;
	graph__transformation_matrix[5]  = scale;
	graph__transformation_matrix[12] = x;
	graph__transformation_matrix[13] = y;
	update_graph_transformation();
};
const update_graph_transformation = () => {
	graph_gl.uniform4fv(graph_gl_u_graphmatrixmult, underlying_buffer2);
};

var graph_gl__a_nodepositionmatrices_buf = null;
const graph_outline_width__scaled = 0.001;
const update_graph_node_coord__webgl = (matrix_indx, i) => {
	const x = all_graph_nodes__xyr[3*i];
	const y = all_graph_nodes__xyr[3*i+1];
	const r = all_graph_nodes__xyr[3*i+2];
	const R = r + graph_outline_width__scaled;
	
	all_graph_nodes__matrixmults[matrix_indx    ]   = x - R;
	all_graph_nodes__matrixmults[matrix_indx + 1]   = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 2]   = x + R;
	all_graph_nodes__matrixmults[matrix_indx + 3]   = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 4]   = x - R/2;
	all_graph_nodes__matrixmults[matrix_indx + 5]   = y + sqrt3_div2*R;
	
	
	all_graph_nodes__matrixmults[matrix_indx + 6]   = x + R;
	all_graph_nodes__matrixmults[matrix_indx + 7]   = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 8]   = x + R/2;
	all_graph_nodes__matrixmults[matrix_indx + 9]   = y + sqrt3_div2*R;
	
	all_graph_nodes__matrixmults[matrix_indx + 10]  = x - R/2;
	all_graph_nodes__matrixmults[matrix_indx + 11]  = y + sqrt3_div2*R;
	
	
	all_graph_nodes__matrixmults[matrix_indx + 12]  = x + R;
	all_graph_nodes__matrixmults[matrix_indx + 13]  = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 14]  = x + R/2;
	all_graph_nodes__matrixmults[matrix_indx + 15]  = y - sqrt3_div2*R;
	
	all_graph_nodes__matrixmults[matrix_indx + 16]  = x - R/2;
	all_graph_nodes__matrixmults[matrix_indx + 17]  = y - sqrt3_div2*R;
	
	
	all_graph_nodes__matrixmults[matrix_indx + 18]  = x - R;
	all_graph_nodes__matrixmults[matrix_indx + 19]  = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 20]  = x + R;
	all_graph_nodes__matrixmults[matrix_indx + 21]  = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 22]  = x - R/2;
	all_graph_nodes__matrixmults[matrix_indx + 23]  = y - sqrt3_div2*R;
	
	
	
	
	all_graph_nodes__matrixmults[matrix_indx + 24]  = x - r;
	all_graph_nodes__matrixmults[matrix_indx + 25]  = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 26]  = x + r;
	all_graph_nodes__matrixmults[matrix_indx + 27]  = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 28]  = x - r/2;
	all_graph_nodes__matrixmults[matrix_indx + 29]  = y + sqrt3_div2*r;
	
	
	all_graph_nodes__matrixmults[matrix_indx + 30]  = x + r;
	all_graph_nodes__matrixmults[matrix_indx + 31]  = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 32]  = x + r/2;
	all_graph_nodes__matrixmults[matrix_indx + 33]  = y + sqrt3_div2*r;
	
	all_graph_nodes__matrixmults[matrix_indx + 34]  = x - r/2;
	all_graph_nodes__matrixmults[matrix_indx + 35]  = y + sqrt3_div2*r;
	
	
	all_graph_nodes__matrixmults[matrix_indx + 36]  = x + r;
	all_graph_nodes__matrixmults[matrix_indx + 37]  = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 38]  = x + r/2;
	all_graph_nodes__matrixmults[matrix_indx + 39]  = y - sqrt3_div2*r;
	
	all_graph_nodes__matrixmults[matrix_indx + 40]  = x - r/2;
	all_graph_nodes__matrixmults[matrix_indx + 41]  = y - sqrt3_div2*r;
	
	
	all_graph_nodes__matrixmults[matrix_indx + 42]  = x - r;
	all_graph_nodes__matrixmults[matrix_indx + 43]  = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 44]  = x + r;
	all_graph_nodes__matrixmults[matrix_indx + 45]  = y;
	
	all_graph_nodes__matrixmults[matrix_indx + 46]  = x - r/2;
	all_graph_nodes__matrixmults[matrix_indx + 47]  = y - sqrt3_div2*r;
};
const update_graph_edge_coord__webgl = (matrix_indx, edge_indx) => {
	const x = all_graph_edges__xyr[edge_indx*graph__edges__elements_per_edge + graph__edges__indx__x1];
	const y = all_graph_edges__xyr[edge_indx*graph__edges__elements_per_edge + graph__edges__indx__y1];
	
	const p = all_graph_edges__xyr[edge_indx*graph__edges__elements_per_edge + graph__edges__indx__x2];
	const q = all_graph_edges__xyr[edge_indx*graph__edges__elements_per_edge + graph__edges__indx__y2];
	
	const r = all_graph_edges__xyr[edge_indx*graph__edges__elements_per_edge + graph__edges__indx__r];
	
	const d = ((p-x)**2 + (q-y)**2)**0.5;
	
	const rcos_theta = r * (y - q) / d;
	const rsin_theta = r * (p - x) / d;
	
	
	all_graph_nodes__matrixmults[matrix_indx    ]   = x - rcos_theta;
	all_graph_nodes__matrixmults[matrix_indx + 1]   = y - rsin_theta;
	
	all_graph_nodes__matrixmults[matrix_indx + 2]   = p - rcos_theta;
	all_graph_nodes__matrixmults[matrix_indx + 3]   = q - rsin_theta;
	
	all_graph_nodes__matrixmults[matrix_indx + 4]   = p + rcos_theta;
	all_graph_nodes__matrixmults[matrix_indx + 5]   = q + rsin_theta;
	
	
	all_graph_nodes__matrixmults[matrix_indx + 6]   = x - rcos_theta;
	all_graph_nodes__matrixmults[matrix_indx + 7]   = y - rsin_theta;
	
	all_graph_nodes__matrixmults[matrix_indx + 8]   = x + rcos_theta;
	all_graph_nodes__matrixmults[matrix_indx + 9]   = y + rsin_theta;
	
	all_graph_nodes__matrixmults[matrix_indx + 10]  = p + rcos_theta;
	all_graph_nodes__matrixmults[matrix_indx + 11]  = q + rsin_theta;
};
const set_graph_node_coords = coords => {
	graph_gl.bindBuffer(graph_gl.ARRAY_BUFFER, graph_gl__a_nodepositionmatrices_buf);
	graph_gl.bufferSubData(graph_gl.ARRAY_BUFFER, 0, coords);
	
	graph_gl.enableVertexAttribArray(0 /*graph_gl__a_nodepositionmatrices_loc*/);
	graph_gl.vertexAttribPointer(
		0 /*graph_gl__a_nodepositionmatrices_loc*/, // location
		2,                // size (num values to pull from buffer per iteration)
		graph_gl.FLOAT,   // type of data in buffer
		false,            // normalize
		8,                // stride: 4*16==sizeof(matrix), num bytes to advance to get to next set of values
		0                 // offset
	);
};

const change_parent_of_node1_to_node2 = (node1, node2) => {
	const prev_parent_indx = all_parents[node1-1];
	const parent_connectns = connectionses[prev_parent_indx];
	const sdfijsodfijsijfd = parent_connectns.indexOf(node1);
	connectionses[prev_parent_indx] = parent_connectns.splice(0,sdfijsodfijsijfd).concat(parent_connectns.splice(sdfijsodfijsijfd+1,parent_connectns.length));
	
	all_parents[node1-1] = node2;
	
	connectionses[node1][0] = node2;
	connectionses[node2].push(node1);
};

var graph_gl;
var graph_2dcanvas;
document.addEventListener("DOMContentLoaded", () => {
	const graph_canvas = document.getElementById("graph-canvas");
	graph_gl = graph_canvas.getContext('webgl2', {stencil:true,depth:false,alpha:false});
	graph_2dcanvas = document.getElementById("graph-text-canvas").getContext("2d");
	
	const graph_gl_program = init_graph(
		graph_gl,
		`#version 300 es
precision highp float;

layout(location=0)in vec4 a;
layout(location=1)in float b;
uniform vec4 u[56];
out float v_colour;
void main(){
	gl_Position=mat4(u[0], u[1], u[2], u[3])*a;
	v_colour=b;
}`,
		`#version 300 es
precision highp float;

uniform vec4 u[56];
precision highp float;
in float v_colour;
out vec4 c;
void main(){
	int is_light_theme = 0;
	c=u[4 + 2*int(v_colour) + is_light_theme];
}`
	);
	
	graph_gl.disable(graph_gl.DEPTH_TEST);
	graph_gl_u_graphmatrixmult = graph_gl.getUniformLocation(graph_gl_program, "u");
	update_graph_transformation();
	
	const set_graph_canvas_dimensions = (w,h) => {
		graph_2dcanvas.canvas.width  = graph_gl.canvas.width  = graph_canvas_width  = w;
		graph_2dcanvas.canvas.height = graph_gl.canvas.height = graph_canvas_height = h;
		
		// Style has to be reset for some reason
		graph_2dcanvas.textAlign = "start";
		graph_2dcanvas.textBaseline = "middle";
		graph_2dcanvas.lineWidth = 5;
		graph_2dcanvas.fillStyle = "#ffffff";
		
		graph_gl.viewport(0, 0, w, h);
		if (all_titles !== null)
			draw_graph_frame_or_polygon_replacement();
	};
	
	const resize_observer = new ResizeObserver(entries => {
		for (const entry of entries){
			// From https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
			let width;
			let height;
			let dpr = window.devicePixelRatio;
			if (entry.devicePixelContentBoxSize){
				// NOTE: Only this path gives the correct answer
				// The other 2 paths are an imperfect fallback
				// for browsers that don't provide anyway to do this
				width = entry.devicePixelContentBoxSize[0].inlineSize;
				height = entry.devicePixelContentBoxSize[0].blockSize;
				dpr = 1; // it's already in width and height
			} else if (entry.contentBoxSize){
				if (entry.contentBoxSize[0]){
					width = entry.contentBoxSize[0].inlineSize;
					height = entry.contentBoxSize[0].blockSize;
				} else {
				// legacy
					width = entry.contentBoxSize.inlineSize;
					height = entry.contentBoxSize.blockSize;
				}
			} else {
				// legacy
				width = entry.contentRect.width;
				height = entry.contentRect.height;
			}
			const displayWidth = /*parseInt*/~~(width * dpr);
			const displayHeight = /*parseInt*/ ~~(height * dpr);
			
			
			if ((graph_canvas_width !== displayWidth) || (graph_canvas_height !== displayHeight)){
				set_graph_canvas_dimensions(displayWidth, displayHeight);
			}
		}
	});
	resize_observer.observe(graph_canvas, {box: 'content-box'}); // Observe changes to the content-box property. See https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
	
	// A hidden part of gl.vertexAttribPointer is that it binds the current ARRAY_BUFFER to the attribute. In other words now this attribute is bound to position_buf. That means we're free to bind something else to the ARRAY_BUFFER bind point. The attribute will continue to use position_buf.
	
	if (graph_canvas_width === 0){
		set_graph_canvas_dimensions(graph_canvas.clientWidth || 1024,  graph_canvas.clientHeight || 1024);
	}
	
	process_entries();
	draw_graph_frame();
	
	/* TODO graph_canvas.addEventListener("webglcontextlost", eventobj=>{
		eventobj.preventDefault();
		console.log("webglcontextlost");
		// automatically restores context it seems - although haven't ensured that this event fires
	});
	graph_canvas.addEventListener("webglcontextrestored", ()=>{
		console.log("webglcontextrestored");
		set_up_webgl();
		for__allocate_graph_webgl_memory__init_graph_gl_buffers();
		set_graph_node_colourstates(all_graph_nodes__colours);
		draw_graph_frame();
	});*/
	
	let graph__hasnt_moved_pointer_since_clicking;
	let d3__currently_selected__last_tmp_value = null;
	let clicked_on_region_indx = -1;
	graph_canvas.oncontextmenu = e => false;
	graph_canvas.addEventListener("pointerdown", eventobj => {
		eventobj.preventDefault();
		
		[d3__svg__clickedat_x, d3__svg__clickedat_y] = get_canvas_coords_from_pointer_event(eventobj);
		let xcoord_for_selections = (d3__svg__clickedat_x-graph__transformation_matrix[12])/graph__transformation_matrix[0];
		let ycoord_for_selections = (d3__svg__clickedat_y-graph__transformation_matrix[13])/graph__transformation_matrix[5];
		d3__currently_selected__last_tmp_value = node_containing_coords(xcoord_for_selections, ycoord_for_selections);
		
		graph__hasnt_moved_pointer_since_clicking = 1;
			if (d3__currently_selected__last_tmp_value !== null){
				d3__currently_selected = d3__currently_selected__last_tmp_value;
				unhighlight_hovered_nodes();
				highlight_node(d3__currently_selected,0,eventobj.ctrlKey);
				
				nodecontent.innerText = contents[d3__currently_selected];
				nodecontent_checkbox.checked = contents[d3__currently_selected].startsWith("USED: ");
				nodecontent.contentEditable = true;
				node_select_parent.disabled = false;
				node_select_sibling1.disabled = false;
				nodecontent_checkbox.disabled = false;
				nodecontent_save.disabled = false;
				nodecontent_createsibling_input.disabled = false;
				nodecontent_colourgroup_input.disabled = false;
				currently_displaying_node_indx = d3__currently_selected;
				
				const all_children_nodeindices = [];
				let children_list_innerHTML = "";
				for (let nodeindx = 1;  nodeindx <= all_parents.length;  ++nodeindx){
					if (all_parents[nodeindx-1] === currently_displaying_node_indx){
						all_children_nodeindices.push(nodeindx);
						let child_has_children = false;
						for (let nodeindx2 = 1;  nodeindx2 <= all_parents.length;  ++nodeindx2){
							child_has_children ||= (all_parents[nodeindx2-1] === nodeindx);
						}
						children_list_innerHTML += "<div>"+all_titles[nodeindx];
						if (!child_has_children)
							children_list_innerHTML += " (Childless)</div>";
						children_list_innerHTML += "</div>";
					}
				}
				children_list.innerHTML = children_list_innerHTML;
				
				let siblings_list_innerHTML = "";
				for (let nodeindx of connectionses[d3__currently_selected]){
					if (!all_children_nodeindices.includes(nodeindx)){
						siblings_list_innerHTML += "<div data-i=\""+nodeindx+"\"><span>"+title_and_parenttitle(nodeindx)+"</span> <button>Unlink</button></div>";
					}
				}
				siblings_list.innerHTML = siblings_list_innerHTML;
				
				nodecontent_colourgroup_input.value = nodecolours[d3__currently_selected];
				
				nodecontent_parent_title.innerText = (d3__currently_selected === 0) ? "" : all_titles[all_parents[d3__currently_selected-1]];
			}
	});
	
	document.getElementById("graph-btn--reset").addEventListener("pointerdown", ()=>{
		set_graph_transformation(0.00004,0.0,0.0);
		draw_graph_frame_or_polygon_replacement();
	});
	
	nodecontent_checkbox.addEventListener("change", ()=>{
		let content = contents[currently_displaying_node_indx];
		if (content.startsWith("USED: ")){
			content = content.substr(6);
		} else {
			content = "USED: " + content;
		}
		contents[currently_displaying_node_indx] = content;
		all_titles[currently_displaying_node_indx] = title_from_content(content);
		
		draw_graph_frame__text_overlay();
		
		nodecontent.innerText = content;
		
		save_btn.disabled = false;
		copy_btn.disabled = false;
	});
	
	nodecontent_save.addEventListener("pointerup", ()=>{
		const all_highlighted_nodes = graph__highlighted_nodes[0];
		if (all_highlighted_nodes.length === 1){
			const nodeindx = all_highlighted_nodes[0];
			nodecontent_save.disabled = true;
			contents[nodeindx] = nodecontent.innerText;
			nodecontent_checkbox.checked = contents[nodeindx].startsWith("USED: ");
			all_titles[nodeindx] = title_from_content(contents[nodeindx]);
			draw_graph_frame__text_overlay();
			nodecontent_save.disabled = false;
			
			save_btn.disabled = false;
			copy_btn.disabled = false;
		} else {
			nodecontent.innerText = "NO! Select exactly 1 node\n"+nodecontent.innerText;
		}
	});
	nodecontent_createsibling_input.addEventListener("pointerup", ()=>{
		const sibling_halfr = all_graph_nodes__xyr[currently_displaying_node_indx*3+2];
		
		let this_node_indx = 0;
		const NNN = all_titles.length;
		while (
			(this_node_indx < NNN) &&
			(
				(connectionses[this_node_indx].length !== 1) ||
				(all_titles[this_node_indx] !== "New Node") ||
				(this_node_indx === currently_displaying_node_indx)
			)
		){
			++this_node_indx;
		}
		if (this_node_indx !== NNN){
			// reusing old node
			change_parent_of_node1_to_node2(this_node_indx, currently_displaying_node_indx);
		} else {
			connectionses[currently_displaying_node_indx].push(connectionses.length);
			connectionses.push([currently_displaying_node_indx]);
			all_parents.push(currently_displaying_node_indx);
			nodecolours.push(nodecolours[currently_displaying_node_indx]);
			contents.push("New Node");
			all_titles.push(title_from_content("New Node"));
			
			if (spare_allgraphnodesxyr_space === 0){
				spare_allgraphnodesxyr_space = 300;
				const all_graph_nodes__xyr__new = new Float32Array(all_graph_nodes__xyr.length + 3 + spare_allgraphnodesxyr_space);
				all_graph_nodes__xyr__new.set(all_graph_nodes__xyr);
				all_graph_nodes__xyr = all_graph_nodes__xyr__new;
			}
			spare_allgraphnodesxyr_space -= 3;
		}
		
		const t = 100.0*Date.now();
		
		all_graph_nodes__xyr[this_node_indx*3  ] = all_graph_nodes__xyr[currently_displaying_node_indx*3+0]+2.0*Math.cos(t)*sibling_halfr;
		all_graph_nodes__xyr[this_node_indx*3+1] = all_graph_nodes__xyr[currently_displaying_node_indx*3+1]+2.0*Math.sin(t)*sibling_halfr;
		
		fix_nodesizes_of_descendents(currently_displaying_node_indx);
		
		process_entries();
		draw_graph_frame();
		
		children_list.innerHTML += "<div>New Node</div>";
	});
	
	graph_canvas.addEventListener("pointerup", eventobj => {
		d3__currently_selected = null;
		clicked_on_region_indx = -1;
		const [x,y] = get_canvas_coords_from_pointer_event(eventobj);
		if (graph__hasnt_moved_pointer_since_clicking && (d3__currently_selected__last_tmp_value===null)){
			nodecontent.contentEditable = false;
			node_select_parent.disabled = true;
			node_select_sibling1.disabled = true;
			nodecontent_checkbox.disabled = true;
			nodecontent_save.disabled = true;
			nodecontent_createsibling_input.disabled = true;
			nodecontent_colourgroup_input.disabled = true;
			nodecontent.innerText = "";
			children_list.innerHTML = "";
			siblings_list.innerHTML = "";
			nodecontent_parent_title.innerText = "";
			currently_displaying_node_indx = -1;
			unhighlight_all_nodes();
		}
	});
	graph_canvas.addEventListener("pointerleave", ()=>d3__currently_selected=null);
	
	let prev_hovered_over_node = null;
	graph_canvas.addEventListener("pointermove", eventobj => {
		graph__hasnt_moved_pointer_since_clicking = 0;
		if ((d3__currently_selected !== null) && (polygonarr_displaying_instead_of_main_graph__positions === null)){
			const [xcoord, ycoord] = graph__get_coords_from_pointer_event(eventobj);
			all_graph_nodes__xyr[3*d3__currently_selected  ] = xcoord;
			all_graph_nodes__xyr[3*d3__currently_selected+1] = ycoord;
			for (let edge_indx of all_graph_nodes__edges[d3__currently_selected]){
				if (all_graph_edges__ab[2 * edge_indx] === d3__currently_selected){
					all_graph_edges__xyr[graph__edges__elements_per_edge * edge_indx + graph__edges__indx__x1] = xcoord;
					all_graph_edges__xyr[graph__edges__elements_per_edge * edge_indx + graph__edges__indx__y1] = ycoord;
				} else {
					all_graph_edges__xyr[graph__edges__elements_per_edge * edge_indx + graph__edges__indx__x2] = xcoord;
					all_graph_edges__xyr[graph__edges__elements_per_edge * edge_indx + graph__edges__indx__y2] = ycoord;
				}
				update_graph_edge_coord__webgl(12*edge_indx, edge_indx);
			}
			update_graph_node_coord__webgl(12*n_graph_edges + 48*d3__currently_selected, d3__currently_selected);
			update_highlighted_node_coords();
			set_graph_node_coords(all_graph_nodes__matrixmults);
			draw_graph_frame();
		} else if (eventobj.buttons&1){ // left mouse button // TODO: WTFFFF
			const [xcoord, ycoord] = get_canvas_coords_from_pointer_event(eventobj);
			if (eventobj.ctrlKey){
				console.log(clicked_on_region_indx,  xcoord - d3__svg__clickedat_x,  ycoord - d3__svg__clickedat_y);
			} else {
				graph__transformation_matrix[12] += xcoord - d3__svg__clickedat_x;
				graph__transformation_matrix[13] += ycoord - d3__svg__clickedat_y;
				update_graph_transformation();
			}
			draw_graph_frame_or_polygon_replacement();
			d3__svg__clickedat_x = xcoord;
			d3__svg__clickedat_y = ycoord;
		} else if (polygonarr_displaying_instead_of_main_graph__positions === null) {
			const [xcoord, ycoord] = get_canvas_coords_from_pointer_event(eventobj);
			let xcoord_for_selections = (xcoord-graph__transformation_matrix[12])/graph__transformation_matrix[0];
			let ycoord_for_selections = (ycoord-graph__transformation_matrix[13])/graph__transformation_matrix[5];
			const hovering_over_node = node_containing_coords(xcoord_for_selections, ycoord_for_selections);
			if (hovering_over_node !== prev_hovered_over_node){
				prev_hovered_over_node = hovering_over_node;
				if (hovering_over_node === null){
					unhighlight_hovered_nodes();
					draw_graph_frame();
				} else if (hovering_over_node !== d3__currently_selected){
					highlight_node(hovering_over_node,4,eventobj.ctrlKey);
				}
			}
		}
	});
	
	graph_canvas.addEventListener("wheel", eventobj => {
		const r = 1.0 - 0.001 * eventobj.deltaY * (1 + 33*eventobj.deltaMode);
		const [x, y] = get_canvas_coords_from_pointer_event(eventobj);
		graph__transformation_matrix[0] *= r;
		graph__transformation_matrix[5] *= r;
		graph__transformation_matrix[12] = r*graph__transformation_matrix[12] + x - r*x;
		graph__transformation_matrix[13] = r*graph__transformation_matrix[13] + y - r*y;
		update_graph_transformation();
		draw_graph_frame_or_polygon_replacement();
	});
	
	// NOTE: Probably no real reason to scale this up.
	/*let current_canvas_w = 1000;
	let current_canvas_h = 1000;
	setInterval(()=>{
		// TODO: NOTE: See https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html for reasons why avoiding window.clientWidth/innerWidth and instead using ???
		let w = window.clientWidth  || window.innerWidth;
		let h = window.clientHeight || window.innerHeight;
		if (w < 1000)
			w = 1000;
		if (h < 1000)
			h = 1000;
		if (w !== current_canvas_w || h !== current_canvas_h){
			current_canvas_w = w;
			current_canvas_h = h;
			graph_gl.canvas.width  = current_canvas_w;
			graph_gl.canvas.height = current_canvas_h;
			graph_gl.viewport(0, 0, graph_gl.canvas.width, graph_gl.canvas.height);
			draw_graph_frame();
		}
	}, 1000); // Every second, check if window has been resized. Doing it on "resize" event might trigger it hundreds of times if the window is being resized by mouse*/
	
	const title_and_parenttitle = nodeindx => {
		return ((nodeindx===0)?"":all_titles[all_parents[nodeindx-1]])+" &lt; "+all_titles[nodeindx];
	};
	
	const node_selector_fn = eventobj => {
		let siblings_adder_list_innerHTML = "";
		const pattern = get_regexp_from_user_input_event(eventobj);
		const tgt = eventobj.currentTarget;
		const avoid_node_indices = [currently_displaying_node_indx];
		if (tgt === node_select_parent){
			// This avoids all descendants:
			for (let i = 0;  i < avoid_node_indices.length;  ++i){ // NOTE: avoid_node_indices.length varies
				const childnodeindx = avoid_node_indices[i];
				for (let grandchildnodeindx = 1;  grandchildnodeindx <= all_parents.length;  ++grandchildnodeindx){
					if (all_parents[grandchildnodeindx-1] === childnodeindx){
						avoid_node_indices.push(grandchildnodeindx);
					}
				}
			}
			
			avoid_node_indices.push(all_parents[currently_displaying_node_indx-1]);
			/* This avoids all ancestors:
			let parent_node_indx = currently_displaying_node_indx;
			while(parent_node_indx !== 0){
				parent_node_indx = all_parents[parent_node_indx-1];
				avoid_node_indices.push(parent_node_indx);
			} */
		}
		if (pattern !== null){
			const matched_node_indices = [];
			for (let i = 0;  i < contents.length;  ++i){
				if (contents[i].match(pattern) !== null){
					if (!avoid_node_indices.includes(i))
						matched_node_indices.push(i);
				}
			}
			
			for (let nodeindx of matched_node_indices){
				siblings_adder_list_innerHTML += "<div data-i=\""+nodeindx+"\"><span>"+title_and_parenttitle(nodeindx)+"</span> <button>Select</button></div>";
			}
		}
		tgt.previousElementSibling.innerHTML = siblings_adder_list_innerHTML;
	};
	
	const node_select_parent = document.getElementById("node_select_parent");
	node_select_parent.addEventListener("input", node_selector_fn);
	
	const node_select_sibling1 = document.getElementById("node_select_sibling1");
	
	node_select_sibling1.addEventListener("input", node_selector_fn);
	document.getElementById("nodecontent_container").addEventListener("pointerup", e=>{
		const tgt = e.target;
		const nodeindx2 = parseInt(tgt.parentNode.dataset.i);
		if (tgt.tagName === "SPAN"){
			//highlight_and_centre_node(graph_gl, nodeindx2, 4, 0, true);
			centre_graph_on_bounding_box(
				all_graph_nodes__xyr[3*nodeindx2  ]-all_graph_nodes__xyr[3*nodeindx2+2],
				all_graph_nodes__xyr[3*nodeindx2  ]+all_graph_nodes__xyr[3*nodeindx2+2],
				all_graph_nodes__xyr[3*nodeindx2+1]-all_graph_nodes__xyr[3*nodeindx2+2],
				all_graph_nodes__xyr[3*nodeindx2+1]+all_graph_nodes__xyr[3*nodeindx2+2],
				0.125
			);
			draw_graph_frame();
		} else {
		if (tgt.parentNode.parentNode === parent_changer_list){
			change_parent_of_node1_to_node2(currently_displaying_node_indx, nodeindx2);
			process_entries();
			draw_graph_frame();
			
			// TODO: all_graph_edges__ab doesn't seem to be updated properly, despite being done in process_entries
			
			nodecontent_parent_title.innerText = all_titles[nodeindx2];
			
			save_btn.disabled = false;
			copy_btn.disabled = false;
		}
		if (tgt.parentNode.parentNode === siblings_adder_list){
			if (!connectionses[currently_displaying_node_indx].includes(nodeindx2)){
				misc_connections.push(currently_displaying_node_indx, nodeindx2);
				connectionses[currently_displaying_node_indx].push(nodeindx2);
				connectionses[nodeindx2                     ].push(currently_displaying_node_indx);
				process_entries();
				draw_graph_frame();
				siblings_list.innerHTML += "<div data-i=\""+nodeindx2+"\"><span>"+title_and_parenttitle(nodeindx2)+"</span> <button>Delete</button></div>";
				
				save_btn.disabled = false;
				copy_btn.disabled = false;
			}
		}
		if (tgt.parentNode.parentNode === siblings_list){
			for (let i = 0;  i < misc_connections.length;  i+=2){
				if (
					((misc_connections[i] === currently_displaying_node_indx) && (misc_connections[i+1] === nodeindx2                     )) ||
					((misc_connections[i] === nodeindx2                     ) && (misc_connections[i+1] === currently_displaying_node_indx))
				){
					misc_connections = misc_connections.slice(0,i).concat(misc_connections.slice(i+2,misc_connections.length));
					break;
				}
			}
			connectionses[currently_displaying_node_indx] = connectionses[currently_displaying_node_indx].filter(x => x !== nodeindx2);
			connectionses[nodeindx2]                      = connectionses[nodeindx2                     ].filter(x => x !== currently_displaying_node_indx);
			process_entries();
			draw_graph_frame();
			tgt.parentNode.remove();
			
			save_btn.disabled = false;
			copy_btn.disabled = false;
		}
		}
	});
});

const centre_graph_on_bounding_box = (min_x, max_x, min_y, max_y, half_scaleby) => {
	// NOTE: To restrict the screen to EXACTLY the box, half_scaleby = 0.5
	let max_width_or_height = half_scaleby / (((max_x-min_x > max_y-min_y)|0) * (max_x-min_x)  +  ((((max_x-min_x > max_y-min_y)|0) ^ 1) * (max_y-min_y)));
	if (graph_canvas_width > graph_canvas_height){
		max_width_or_height *= graph_canvas_height / graph_canvas_width;
	}
	// NOTE: No need to guarantee a minimum width, because every node is guaranteed to be connected to at least one other node
	graph__transformation_matrix[0]  = max_width_or_height;
	graph__transformation_matrix[5]  = max_width_or_height * graph_canvas_width / graph_canvas_height;
	graph__transformation_matrix[12] = -0.5 * max_width_or_height * (min_x + max_x);
	graph__transformation_matrix[13] = -0.5 * max_width_or_height * (min_y + max_y) * graph_canvas_width / graph_canvas_height;
	update_graph_transformation();
};

const fix_nodesizes_of_descendents = (parent_node_indx) => {
	const this_node_size = all_graph_nodes__xyr[parent_node_indx*3+2]/(connectionses[parent_node_indx].length - 1 + (parent_node_indx===0));
	for (let nodeindx of connectionses[parent_node_indx]){
		if ((nodeindx !== 0) && (all_parents[nodeindx-1] === parent_node_indx)){
			// is child of parent_node_indx
			all_graph_nodes__xyr[nodeindx*3+2] = this_node_size;
			fix_nodesizes_of_descendents(nodeindx);
		}
	}
};

const graph__highlighted_nodes = [
	[], [], // Primary highlighted (clicked nodes)
	
	[], [], // Secondary highlighted (neighbours of primary) // NOTE: The 2nd array never has edges in it
	
	[], [], // Tertiary highlighted (hovered nodes)
	
	[], []  // Quartiary highlighted (neighbours of hovered) // NOTE: The 2nd array never has edges in it
]; // [Active, passive] highlights, consisting each of [colour_options, nodes], where nodes consists of node indices
var graph_text_size_multiplier = 1;
var graphcanvas__is_any_text_displayed = 0;
const draw_graph_frame__text_overlay = () => {
	graphcanvas__is_any_text_displayed && graph_2dcanvas.clearRect(0,0,graph_canvas_width,graph_canvas_height); // Wipe text overlay
	graphcanvas__is_any_text_displayed = 1;
	for (let i = graph__highlighted_nodes.length;  i !== 0;  ){
		i-=2;
		for (let node_indx of graph__highlighted_nodes[i]){
			const r = all_graph_nodes__xyr[3*node_indx+2] * graph__transformation_matrix[0];
			let [x,y] = matrix_44_apply_to_v2(graph__transformation_matrix, all_graph_nodes__xyr[3*node_indx], all_graph_nodes__xyr[3*node_indx+1]);
			x -= r*0.5;
			if ((x > -1.0) && (x < 1.0) && (y > -1.0) && (y < 1.0)){
				graph_2dcanvas.fillStyle = colours[nodecolours[node_indx]];
				graph_2dcanvas.font = `bold ${parseInt(r*graph_canvas_width*graph_text_size_multiplier)}px Arial`; // NOTE: Unfortunately there is no way to merely set the fontSize
				graph_2dcanvas.strokeText(all_titles[node_indx], graph_canvas_width*(x+1)/2, graph_canvas_height*(-y+1)/2);
				graph_2dcanvas.fillText(all_titles[node_indx], graph_canvas_width*(x+1)/2, graph_canvas_height*(-y+1)/2);
			}
		}
	}
	for (let node_indx of graph__highlighted_nodes[0]){
		graph_2dcanvas.fillStyle = "#ffffff";
		const r = all_graph_nodes__xyr[3*node_indx+2] * graph__transformation_matrix[0];
		let [x,y] = matrix_44_apply_to_v2(graph__transformation_matrix, all_graph_nodes__xyr[3*node_indx], all_graph_nodes__xyr[3*node_indx+1]);
		x -= r*0.5;
		graph_2dcanvas.font = `bold ${parseInt(r*graph_canvas_width*graph_text_size_multiplier)}px Arial`; // NOTE: Unfortunately there is no way to merely set the fontSize
		
		const content = contents[node_indx];
		let offset = content.indexOf("\n");
		if ((offset !== -1) || (content.length > max_line_length)){
			let yy = r + (-y+1)/2;
			if ((offset > max_line_length) || (offset === -1))
				offset = max_line_length;
			while (offset !== content.length){
				let next_offset = content.indexOf("\n",offset+1);
				if (next_offset === -1)
					next_offset = content.length;
				if (next_offset > offset+max_line_length)
					next_offset = offset+max_line_length;
				const line = content.substr(offset,next_offset-offset);
				graph_2dcanvas.strokeText(line, graph_canvas_width*(x+1)/2, graph_canvas_height*yy);
				graph_2dcanvas.fillText(line, graph_canvas_width*(x+1)/2, graph_canvas_height*yy);
				yy += r;
				offset = next_offset;
				if (graph_canvas_height*yy > 900) // probably off-screen
					break;
			}
		}
	}
};
const draw_graph_frame_or_polygon_replacement = () => {
	draw_graph_frame();
};
const draw_graph_frame = () => {
	graph_gl.clear(graph_gl.COLOR_BUFFER_BIT); // Wipes the screen // TODO: Figure out why - when not in dark mode - this ALWAYS wipes the screen AFTER the following command:
	graph_gl.drawArrays(
		graph_gl.TRIANGLES,
		0,                         // offset
		24 * all_titles.length + 6*n_graph_edges + 3*n_extra_graph_triangles_to_render     // num vertices???
	);
	
	graph_gl.flush(); // Because this is not animated, it doesn't use requestAnimationFrame, so it should be flushed to encourage eager execution (see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#Flush_when_expecting_results_like_queries_or_rendering_frame_completion)
	
	draw_graph_frame__text_overlay();
};
var polygonarr_displaying_instead_of_main_graph__positions = null;
var graph_gl__a_nodecolours_buf;
const set_graph_node_colours = colours_arr => {
	graph_gl.bindBuffer(graph_gl.ARRAY_BUFFER, graph_gl__a_nodecolours_buf);
	graph_gl.bufferSubData(graph_gl.ARRAY_BUFFER, 0, colours_arr);
	
	
	graph_gl.enableVertexAttribArray(1 /*graph_gl__a_nodecolours_loc*/);
	graph_gl.vertexAttribPointer(
		1 /*graph_gl__a_nodecolours_loc*/,
		1,                // size (num values to pull from buffer per iteration)
		graph_gl.FLOAT,
		false,            // normalize
		4,                // stride
		0                 // offset
	);
};
const set_highlighted_node_colours = () => {
	let vertex_indx = 96*all_titles.length + 24*n_graph_edges;
	n_extra_graph_triangles_to_render = 0;
	for (let i = graph__highlighted_nodes.length;  i !== 0;  ){
		// In reverse order because a clicked node might also be counted as hovered
		i-=2;
		for (let edge_indx of graph__highlighted_nodes[i+1]){
			for (let j = 0;  j < 24;  ++j)
				all_graph_nodes__colours[vertex_indx + j] = 1;
			vertex_indx += 24;
			n_extra_graph_triangles_to_render += 2;
		}
	}
	for (let i = graph__highlighted_nodes.length;  i !== 0;  ){
		// In reverse order because a clicked node might also be counted as hovered
		i-=2;
		for (let node_indx of graph__highlighted_nodes[i]){
			for (let j = 0;  j < 12;  ++j)
				all_graph_nodes__colours[vertex_indx + j] = 2;
			vertex_indx += 12;
			for (let j = 0;  j < 12;  ++j)
				all_graph_nodes__colours[vertex_indx + j] = 8; // colour_indx_of_screenwipe (outline)
			vertex_indx += 12;
			n_extra_graph_triangles_to_render += 8;
		}
	}
	
	set_graph_node_colours(all_graph_nodes__colours);
};
const update_highlighted_node_coords = () => {
	let matrix_indx = 48*all_titles.length + 12*n_graph_edges;
	n_extra_graph_triangles_to_render = 0;
	for (let i = graph__highlighted_nodes.length;  i !== 0;  ){
		i-=2;
		for (let edge_indx of graph__highlighted_nodes[i+1]){
			update_graph_edge_coord__webgl(matrix_indx, edge_indx);
			matrix_indx += 12;
			n_extra_graph_triangles_to_render += 2;
		}
	}
	for (let i = graph__highlighted_nodes.length;  i !== 0;  ){
		i-=2;
		for (let node_indx2 of graph__highlighted_nodes[i]){
			update_graph_node_coord__webgl(matrix_indx, node_indx2);
			matrix_indx += 48;
			n_extra_graph_triangles_to_render += 8;
		}
	}
	
	set_graph_node_coords(all_graph_nodes__matrixmults);
};
const highlight_node_intersect__core = (node_indx, highlight_indx) => {
	graph__highlighted_nodes[highlight_indx  ].push(node_indx);
	graph__highlighted_nodes[highlight_indx+2] = graph__highlighted_nodes[highlight_indx+2].filter(x => connectionses[node_indx].includes(x));
	graph__highlighted_nodes[highlight_indx+1] = graph__highlighted_nodes[highlight_indx+1].concat(all_graph_nodes__edges[node_indx]).filter(edge_indx =>
		graph__highlighted_nodes[highlight_indx+2].includes(all_graph_edges__ab[2*edge_indx]) ||
		graph__highlighted_nodes[highlight_indx+2].includes(all_graph_edges__ab[2*edge_indx+1])
	);
};
const highlight_intersect = (node_indices, highlight_indx) => {
	graph__highlighted_nodes[highlight_indx] = [];
	for (let node_indx of node_indices)
		highlight_node_intersect__core(node_indx, highlight_indx);
};
const highlight_node__sort_out_arrs = (node_indx, highlight_indx, ctrl_clicked) => {
	if (ctrl_clicked && (graph__highlighted_nodes[highlight_indx].length!==0)){
		if (graph__highlighted_nodes[highlight_indx].includes(node_indx)){
			// Deselect node
			const ls = graph__highlighted_nodes[highlight_indx].filter(x => x!==node_indx);
			graph__highlighted_nodes[highlight_indx  ] = [];
			graph__highlighted_nodes[highlight_indx+2] = [];
			graph__highlighted_nodes[highlight_indx+1] = [];
			if (ls.length !== 0){
				for (let node_indx2 of ls){
					highlight_node__sort_out_arrs(node_indx2, highlight_indx, 1);
				}
			}
		} else {
			highlight_node_intersect__core(node_indx, highlight_indx);
		}
	} else {
		graph__highlighted_nodes[highlight_indx  ] = [node_indx];
		graph__highlighted_nodes[highlight_indx+1] = all_graph_nodes__edges[node_indx];
		graph__highlighted_nodes[highlight_indx+2] = connectionses[node_indx];
	}
};
const highlight_node = (node_indx, highlight_indx, ctrl_clicked) => {
	highlight_node__sort_out_arrs(node_indx, highlight_indx, ctrl_clicked);
	
	// Append copies of the nodes' geometries to the end of the arrays, to ensure they are rendered atop the other nodes
	
	update_highlighted_node_coords();
	set_highlighted_node_colours();
	draw_graph_frame();
};
const unhighlight_hovered_nodes = () => {
	if (graph__highlighted_nodes[4].length | graph__highlighted_nodes[6].length !== 0){
		graph__highlighted_nodes[4] = [];
		graph__highlighted_nodes[5] = [];
		graph__highlighted_nodes[6] = [];
		set_highlighted_node_colours();
	}
};

const unhighlight_all_nodes = () => {
	if (graph__highlighted_nodes[0].length | graph__highlighted_nodes[2].length | graph__highlighted_nodes[4].length | graph__highlighted_nodes[6].length !==0 ){
		graph__highlighted_nodes[0] = [];
		graph__highlighted_nodes[1] = [];
		graph__highlighted_nodes[2] = [];
		graph__highlighted_nodes[3] = [];
		graph__highlighted_nodes[4] = [];
		graph__highlighted_nodes[5] = [];
		graph__highlighted_nodes[6] = [];
		set_highlighted_node_colours();
		draw_graph_frame();
	}
};
var is_dark_theme = 1;
const graph__reset_node_colours = () => {
	all_graph_nodes__colours.fill(8);
	let colouroffset = 0;
	for (;  colouroffset < n_graph_edges*6;  ++colouroffset){
		all_graph_nodes__colours[colouroffset] = 2;
	}
	for (let i = 0;  i < nodecolours.length;  ++i){
		for (let j = 0;  j < 24;  ++j)
			all_graph_nodes__colours[colouroffset + j] = 1+(nodecolours[i]%26);
		colouroffset += 24;
	}
	set_highlighted_node_colours();
};