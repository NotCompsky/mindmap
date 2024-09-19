🔵 [Try it out here](https://notcompsky.github.io/mindmap/mindmap.html) 🔵

## TOC

* [Features](#Features)
* [Use cases](#Uses)
* [How to install](#Installation)
* [Screenshots](#Example)
* [Alternatives](#Alternatives)

## Features

* Self-hostable
  * It is fully self-contained (one HTML file, one JS file, and one CSS file) with no backend required
* Very fast
  * It uses WebGL and optimised JavaScript
  * Alternatives tend to use SVG or very abstract (and inefficient) libraries, which don't scale well for thousands of nodes
* Very robust
  * Browsers tend to unload WebGL after a long time if you change tabs - you can still save or export your data if this occurs
* Import and export (as JSON files)
* Layout is automatically generated
  * Nodes never overlap
  * Nodes scale according to the size available to them and their descendants
* Nodes can be moved from one 'parent' to another
* Nodes can also have siblings
* Nodes can have custom background colours
  * It can be inherited from parents
* RegEx and normal search

## Uses

What this software is for:

* To represent *huge* mindmaps
* To represent mindmaps that are not simple trees
  * Which have parent, child *and* sibling relations
* It feels most natural when nodes have titles
  * Each node only displays its first line of text, until it is clicked on

What this software lacks:

* Presentation style
  * It only renders Unicode characters
  * It's not pretty enough for PowerPoint presentations
* Version control

## Installation

Copy [mindmap.html](mindmap.html), [mindmap.js](mindmap.js) and [mindmap.css](mindmap.css), and access `mindmap.html` directly in a browser (`file:///path/to/mindmap.html`) or serve them from any file server.

## Example

![Screenshot_20240918_205342](https://github.com/user-attachments/assets/89864844-35bb-4e3c-8d8b-a682a8686fda)
![Screenshot_20240918_205622](https://github.com/user-attachments/assets/67417fba-f093-43d3-aa05-186e018761f5)
![Screenshot_20240918_205649](https://github.com/user-attachments/assets/623e4ee3-ff08-4e47-b0bb-4105986860ac)
![Screenshot_20240918_205711](https://github.com/user-attachments/assets/e80bec5d-e874-4e76-9eae-2d5802439b91)
![Screenshot_20240918_205747](https://github.com/user-attachments/assets/2c65eb99-3795-4c3e-846e-b5eba50f4f50)
![Screenshot_20240918_205806](https://github.com/user-attachments/assets/d3bd7c51-7e19-4351-9176-16065d72c1f7)
![Screenshot_20240918_205830](https://github.com/user-attachments/assets/e043797a-171e-4f1d-9729-1bbce850263e)

## Alternatives

🟢 Feature that my project does not have  
🔴 Failure that my project does not have

* MindmapTree • [Code](https://github.com/RockyRen/mindmaptree) • [Example](https://rockyren.github.io/mindmaptree/demo.html)
  * 🟢 Click and drag
  * 🟢 Undo/redo
  * 🔴 Uses SVG, so:
    * 🔴 it cannot handle thousands of nodes
  * 🔴 Limited to left-right line
  * 🔴 Awkward to display many nodes
* Mindmap by Awehook [Code](https://github.com/awehook/react-mindmap) [Example](https://awehook.github.io/react-mindmap/)
  * 🟢 Collapse/expand branches
  * 🟢 Flowcharts
  * 🔴 Nodes are HTML `<div>`s, so it has the downsides of svg and more limitations on functionality
* TeamMapper • [Code](https://github.com/b310-digital/teammapper) • [Example](https://github.com/b310-digital/teammapper)
  * 🟢 Allows simultaneous collaborative editing
  * 🟢 Inline images, colours, and hyperlinks
  * 🟢 Undo/redo
  * 🟢 Export to image
  * 🔴 Requires backend server
  * 🔴 More fragile (breaks with too many nodes, lags due to server synchronisation)
* MarkMap • [Code](https://github.com/markmap/markmap) • [Example](https://markmap.js.org/repl)
  * 🔴 Uses SVG, so:
    * 🔴 it cannot handle thousands of nodes
  * 🟢 Converts MarkDown text into a mindmap, so:
    * 🟢 it can be used with version control utilities (e.g. `git`)
    * 🟢 it can place inline HTML (tables, LaTex) into the mindmap
  * Similar to [dundalek's MarkMap](https://github.com/dundalek/markmap) but serves the opposite purpose
  * Similar to [a Obsidian plugin](https://github.com/MarkMindCkm/obsidian-enhancing-mindmap)
* MyMind by Ondřej Žára • [Code](https://github.com/ondras/my-mind) • [Example](https://my-mind.github.io/?url=examples%2Ffeatures.mymind)
  * 🟢 Nodes can do basic math operations
  * 🟢 Undo/redo
  * 🟢 Export to image
  * 🟢 Collapse/expand branches
  * 🔴 Uses SVG, so:
    * 🔴 it cannot handle thousands of nodes
    * 🟢 it supports rich text formatting (hyperlinks, colours)
* Mindmaps by David Richard • [Code](https://github.com/drichard/mindmaps) • [Example](https://www.mindmaps.app/)
  * 🟢 Undo/redo (but `undo` sometimes fails)
  * 🔴 Uses SVG, so:
    * 🔴 it cannot handle thousands of nodes
  * 🔴 No ability to save your changes when SVG crashes (to save RAM, browsers often unload SVG/WebGL assets without unloading the page)
  * Can import from this, using `import-from-mymind.py`
* MindMup • [Code](https://github.com/davedf/mapjs) • [Example](http://www.mindmup.com/)
* Neurite • [Code](https://github.com/satellitecomponent/Neurite) • [Example](https://satellitecomponent.github.io/Neurite/)
  * For visualising mathematical systems