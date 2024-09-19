#!/usr/bin/env python3

# To import from https://github.com/drichard/mindmaps

import json
from math import cos, sin, atan, pi

def get_smallest_division_of_angle(one_div_anglestep:int, d:dict):
	n_children:int = len(d["children"])
	biggest_onedivangle:float = one_div_anglestep
	if n_children != 0:
		one_div_anglestep_sub:int = one_div_anglestep*n_children
		for child in d["children"]:
			res:int = get_smallest_division_of_angle(one_div_anglestep_sub, child)
			if res > biggest_onedivangle:
				biggest_onedivangle = res
	return biggest_onedivangle

def process_node(size:float, depth:int, angle_offset:float, angle_step:float, x:float, y:float, contents:list, parents:list, xyr:list, colours:list, nodecolours:list, parent_node_indx:int, d):
	content:str = d["text"]["caption"]
	this_node_indx:int = len(contents)
	if parent_node_indx is not None:
		parents.append(parent_node_indx)
	
	n_children:int = len(d["children"])
	
	contents.append(content)
	if True:
		xyr.append(x)
		xyr.append(y)
		xyr.append(size) # parent_r/((1+n_children)**0.5))
	colour:str = d["branchColor"] # d["text"]["font"]["color"]
	colour_indx:int = len(colours)
	if colour in colours:
		colour_indx = colours.index(colour)
	else:
		colours.append(colour)
	nodecolours.append(colour_indx)
	
	if colour_indx == 28:
		print(f"{int(size)}\t{depth}\t{int(360.0*angle_offset/(2.0*pi))}\t{angle_step}\ty={y}\t{content[:20]}")
	
	if n_children != 0:
		angle_offset_sub:float = angle_offset
		angle_step_sub:float = angle_step/n_children
		skip_ith_anglerange:int = -1
		sorted_children:list = sorted(d["children"], key=lambda x:atan(x["offset"]["y"]/(0.01+x["offset"]["x"])))
		if depth == 1:
			# avoid top and bottom
			angle_step_sub = angle_step/(n_children+2)
			angle_offset_sub = angle_offset + angle_step_sub*0.5
			skip_ith_anglerange = (n_children-1)//2
			# TODO: Sort so that the largest go at the sides. sorted_children = ?
		prev_ysub:float = None
		for i, dd in enumerate(sorted_children):
			distance_from_parent_sub:float = size**0.5
			distance_from_root_sub:float = (x*x + y*y)**0.5 + distance_from_parent_sub
			x_sub:float = distance_from_root_sub*sin(angle_offset_sub)
			y_sub:float = distance_from_root_sub*cos(angle_offset_sub) # Begin at top, ensuring each 
			size_sub:float = size/(n_children**0.5)
			if size_sub < 2.0:
				size_sub = 2.0
			if prev_ysub is not None:
				text_size_sub:float = size_sub*0.01
				if (prev_ysub < y_sub) and (y_sub < prev_ysub+text_size_sub):
					y_sub = prev_ysub + text_size_sub
				elif (prev_ysub-text_size_sub < y_sub) and (y_sub < prev_ysub):
					y_sub = prev_ysub - text_size_sub
			
			process_node(size_sub, depth+1, angle_offset_sub, angle_step_sub, x_sub, y_sub, contents, parents, xyr, colours, nodecolours, this_node_indx, dd)
			angle_offset_sub += angle_step_sub
			prev_ysub = y_sub
			if i == skip_ith_anglerange:
				angle_offset_sub += angle_step_sub

def convert(contents:list, parents:list, xyr:list, colours:list, nodecolours:list, d:dict):
	# print('2.0*pi/len(d["root"]["children"])', 2.0*pi/len(d["root"]["children"]))
	process_node(500.0, 1, 0.0, 2.0*pi, 0.0, 0.0, contents, parents, xyr, colours, nodecolours, None, d["root"])

def extract_node(d:dict, target_depth:int, target_node_content:str):
	retval = None
	for dd in d["children"]:
		if target_depth == 0:
			if dd["text"]["caption"] == target_node_content:
				retval = dd
				d["children"] = [x for x in d["children"] if x!=retval]
				break
		else:
			retval = extract_node(d, target_depth-1, target_node_content)
			if retval is not None:
				break
	return retval

def move_sibling_to_be_child(parent:dict, sibling_content:str, new_parent_content:str):
	sibling = extract_node(parent, 0, sibling_content)
	for dd in parent["children"]:
		if dd["text"]["caption"] == new_parent_content:
			dd["children"].append(sibling)
			return
	raise ValueError("Couldn't find sibling for move_sibling_to_be_child:", sibling_content, new_parent_content)

if __name__ == "__main__":
	import argparse
	
	parser = argparse.ArgumentParser()
	parser.add_argument("fp")
	parser.add_argument("outfile")
	args = parser.parse_args()
	
	contents:list = []
	parents:list = []
	xyr:list = []
	colours:list = []
	nodecolours:list = []
	
	d = None
	with open(args.fp,"rb") as f:
		d = json.load(f)["mindmap"]
	
	root_d:dict = d["root"]
	
	d["root"]["children"].append({"text":{"caption":"per country"},"offset":{"x":0.0,"y":0.0},"branchColor":"#ffffff","children":[]})
	
	convert(contents, parents, xyr, colours, nodecolours, d)
	
	maxes:list = [0.0,0.0,0.0]
	for i in range(3):
		for j in range(0,len(xyr),3):
			if xyr[j+i] > maxes[i]:
				maxes[i] = xyr[j+i]
	minns:list = [x for x in maxes]
	for i in range(3):
		for j in range(0,len(xyr),3):
			if xyr[j+i] < minns[i]:
				minns[i] = xyr[j+i]
	multby_x:float = 20000.0 / (maxes[0]-minns[0])
	multby_y:float = 20000.0 / (maxes[1]-minns[1])
	multby_r:float = 1.0 # 10.0 / maxes[2]
	for i in range(0,len(xyr),3):
		xyr[i+0] *= multby_x
		xyr[i+1] *= multby_y
		xyr[i+2] *= multby_r
	xyr = [(int(n)<<1)^(int(n)>>31) for n in xyr] # ZigZag encoding; can be reversed with (n>>1)^(-(n&1))
	with open(args.outfile,"w") as f:
		f.write(json.dumps([contents,parents,[],nodecolours,colours], separators=(",",":")).replace("\\u2019","’").replace("\\u2014","—").replace("\\u201c","“").replace("\\u201d","”").replace("\\u2013","–"))
