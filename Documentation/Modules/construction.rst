hina.construction
++++++++++++

Tutorial
========

The `construction` module provides functions to construct heterogeneous interaction networks (HINs) directly from input learning process data. The methods in this module are designed to handle the typical data format encountered for learning process data traces, supporting seamless integration with learning analytics workflows.  

Currently, the module contains the `network_construct.py` file, which includes:

- `get_bipartite`: Constructs a bipartite graph from an input pandas dataFrame.
- `get_tripartite`: Constructs a tripartite graph from an input pandas dataFrame.

.. list-table:: Functions
   :header-rows: 1

   * - `get_bipartite(df,student_col,object_col,attr_col = None,group_col = None) <#get-bipartite>`_
     - Constructs a bipartite graph from an input pandas dataFrame.
   * - `get_tripartite(df,student_col,object1_col,object2_col,group_col = None) <#get-tripartite>`_
     - Constructs a tripartite graph from an input pandas dataFrame.

Reference
---------

.. _get-bipartite:

.. raw:: html

   <div id="get-bipartite" class="function-header">
       <span class="class-name">function</span> <span class="function-name">get_bipartite(df,student_col,object_col,attr_col = None,group_col = None)</span> 
       <a href="../Code/network_construct.html#get-bipartite" class="source-link">[source]</a>
   </div>

**Description**:
Constructs a bipartite network projection from dataset columns.

**Parameters**:

.. raw:: html

   <div class="parameter-block">
       (df,student_col,object_col,attr_col = None,group_col = None)
   </div>

   <ul class="parameter-list">
       <li><span class="param-name">df</span>: The input DataFrame containing the data to construct the bipartite graph.</li>
       <li><span class="param-name">student_col</span>: The column name in the DataFrame representing student nodes.</li>
       <li><span class="param-name">object_col</span>: The column name in the DataFrame representing the studied object nodes.</li>
       <li><span class="param-name">attr_col</span>: The column name in the DataFrame representing attributes for object nodes (e.g. the dimension of coded constructs). If provided, these attributes will be added as node attributes in the graph. Default is None.</li>
       <li><span class="param-name">group_col</span>: The column name in the DataFrame representing group information for student nodes. If provided, these groups will be added as node attributes in the graph. Default is None.</li>
   </ul>

**Returns**:
  - networkx.Graph
     A bipartite graph with the following properties:
     - Nodes: Student nodes and object nodes, with 'bipartite' attribute indicating their type.
     - Edges: Weighted edges between student and object nodes, where weights represent the frequency of relationships.
     - Node attributes: If `group_col` is provided, student nodes will have a group attribute. If `attr_col` is provided,
       object nodes will have an attribute.

.. _get-tripartite:

.. raw:: html

   <div id="get-tripartite" class="function-header">
       <span class="class-name">function</span> <span class="function-name">get_tripartite(df,student_col,object1_col,object2_col,group_col = None)</span> 
       <a href="../Code/network_construct.html#get-tripartite" class="source-link">[source]</a>
   </div>

**Description**:
Constructs a tripartite network projection from dataset columns.

**Parameters**:

.. raw:: html

   <div class="parameter-block">
       (df,student_col,object1_col,object2_col,group_col = None)
   </div>

   <ul class="parameter-list">
       <li><span class="param-name">df</span>: The input DataFrame containing the data to construct the bipartite graph.</li>
       <li><span class="param-name">student_col</span>: The column name in the DataFrame representing student nodes.</li>
       <li><span class="param-name">object1_col</span>: The column name in the DataFrame representing the first type of object nodes.</li>
       <li><span class="param-name">object2_col</span>: The column name in the DataFrame representing the second type of object nodes. </li>
       <li><span class="param-name">group_col</span>: The column name in the DataFrame representing group information for student nodes. If provided, these groups will be added as node attributes in the graph. Default is None.</li>
   </ul>

**Returns**:
  - networkx.Graph
     A tripartite graph with the following properties:
     - Nodes: Student nodes and joint object nodes (combining `object1_col` and `object2_col`), with 'bipartite' and
       'tripartite' attributes indicating their type.
     - Edges: Weighted edges between student and joint object nodes, where weights represent the frequency of relationships.
     - Node attributes: If `group_col` is provided, student nodes will have a group attribute.

Demo
====

Example Code
------------

This example demonstrates how to use the `get_bipartite` and `get_tripartite` functions to construct HINs from a learning process dataset.

**Step 1: Import necessary libraries**

.. code-block:: python

    import pandas as pd
    from hina.construction.network_construct import get_bipartite,get_tripartite

**Step 2: Define the dataset**

A dataset containing student-task interactions:

.. code-block:: python

    import pandas as pd
    df = pd.DataFrame({
         'student': ['Alice', 'Bob', 'Alice', 'Charlie'],
         'object1': ['ask questions', 'answer questions', 'evaluating', 'monitoring'],
         'object2': ['tilt head', 'shake head', 'nod head', 'nod head'],
         'group': ['A', 'B', 'A', 'B'],
         'attr': ['cognitive', 'cognitive', 'metacognitive', 'metacognitive']
     })

**Step 3a: Construct the bipartite network representation**

We create a bipartite network representation of the interactions between students and objects in the 'object1' category, adding the additional attribute 'attr' storing object codes.

.. code-block:: python

    B = get_bipartite(df, student_col='student', object_col='object1', attr_col='attr', group_col='group')
    print('Bipartite Graph:\n',B.nodes(data=True))

**Step 3b: Construct a tripartite network representation**

We create a tripartite network representation of the interactions among students and two categories of objects: 'object1' and 'object2'.

.. code-block:: python

    T = get_tripartite(df,student_col='student', object1_col='object1', object2_col='object2', group_col='group')
    print('Tripartite Graph:\n',T.nodes(data=True))


Example Output
--------------

.. code-block:: console

    Bipartite Graph:
       [('Alice', {'bipartite': 'student', 'group': 'A'}), 
         ('Bob', {'bipartite': 'student', 'group': 'B'}), 
         ('Charlie', {'bipartite': 'student', 'group': 'B'}),
         ('ask questions', {'bipartite': 'object1', 'attr': 'cognitive'}), 
         ('answer questions', {'bipartite': 'object1', 'attr': 'cognitive'}), 
         ('evaluating', {'bipartite': 'object1', 'attr': 'metacognitive'}), 
         ('monitoring', {'bipartite': 'object1', 'attr': 'metacognitive'})] 


   Tripartite Graph:
    [('Alice', {'bipartite': 'student', 'group': 'A'}),
     ('Bob', {'bipartite': 'student', 'group': 'B'}), 
     ('Charlie', {'bipartite': 'student', 'group': 'B'}),
     ('ask questions**tilt head', {'bipartite': '(object1,object2)', 'tripartite': True}),
     ('answer questions**shake head', {'bipartite': '(object1,object2)', 'tripartite': True}), 
     ('evaluating**nod head', {'bipartite': '(object1,object2)', 'tripartite': True}), 
     ('monitoring**nod head', {'bipartite': '(object1,object2)', 'tripartite': True})]


Paper Source
============

If you use this function in your work, please cite:
Feng, S., Gibson, D., & Gasevic, D. (2025). Analyzing Students' Emerging Roles Based on Quantity and Heterogeneity of Individual Contributions in Small Group Online Collaborative Learning Using Bipartite Network Analysis. arXiv preprint arXiv:2502.19112.
