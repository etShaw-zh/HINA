hina.construction
++++++++++++

Tutorial
========

The `construction` module provides functions to construct heterogeneous interaction networks (HINs) directly from input learning process data. The methods in this module are designed to handle the typical data format encountered for learning process data traces, supporting seamless integration with learning analytics workflows.  

Currently, the module contains the `network_construct.py` file, which includes:

- `get_bipartite`: Constructs a bipartite graph from an input pandas dataFrame.
- `get_tripartite`: Constructs a tripartite graph from an input pandas dataFrame.

Inputs include:

- **df**: A pandas DataFrame containing individual interactions.
- **student_col**: The column name representing individuals (students).
- **task_col**: The column name representing tasks.

Outputs include:

- **Quantity**: A dictionary mapping individuals to their total weighted participation in tasks.
- **Diversity**: A dictionary mapping individuals to their diversity score based on the entropy of their task distribution.

Individual
==========

This module provides functions for computing node-level measures related to participation in learning networks.

.. list-table:: Functions
   :header-rows: 1

   * - Function
     - Description
   * - `get_bipartite(df, col1, col2) <#get-bipartite>`_
     - Constructs a bipartite network from dataset columns.
   * - `quantity_and_diversity(df, student_col, task_col) <#quantity-and-diversity>`_
     - Computes node-level measures of interaction quantity and diversity.

Reference
---------

.. _get-bipartite:

.. raw:: html

   <div id="get-bipartite" class="function-header">
       <span class="class-name">function</span> <span class="function-name">get_bipartite(df, col1, col2)</span> 
       <a href="../Code/quantity_diversity.html#get-bipartite" class="source-link">[source]</a>
   </div>

**Description**:
Constructs a bipartite network projection from dataset columns.

**Parameters**:

.. raw:: html

   <div class="parameter-block">
       (df, col1, col2)
   </div>

   <ul class="parameter-list">
       <li><span class="param-name">df</span>: A pandas DataFrame containing interaction records.</li>
       <li><span class="param-name">col1</span>: The column name representing one set of nodes (e.g., individuals).</li>
       <li><span class="param-name">col2</span>: The column name representing the second set of nodes (e.g., tasks). If a tuple of column names is provided, attributes will be merged into a composite index.</li>
   </ul>

**Returns**:
  - **set**: A set of tuples `(i, j, w)`, where `i` and `j` are node labels, and `w` is the edge weight (interaction frequency).

.. _quantity-and-diversity:

.. raw:: html

   <div id="quantity-and-diversity" class="function-header">
       <span class="class-name">function</span> <span class="function-name">quantity_and_diversity(df, student_col, task_col)</span> 
       <a href="../Code/quantity_diversity.html#quantity-and-diversity" class="source-link">[source]</a>
   </div>

**Description**:
Computes node-level measures of interaction quantity and diversity.

**Parameters**:

.. raw:: html

   <div class="parameter-block">
       (df, student_col, task_col, weight_col)
   </div>

   <ul class="parameter-list">
       <li><span class="param-name">df</span>: A pandas DataFrame containing interaction records.</li>
       <li><span class="param-name">student_col</span>: The column name representing individuals.</li>
       <li><span class="param-name">task_col</span>: The column name representing tasks.</li>
   </ul>

**Returns**:
  - **tuple**: Two dictionaries:
    - **quantities**: `{node: quantity}` mapping individuals to their total weighted participation.
    - **diversities**: `{node: diversity}` mapping individuals to their diversity score (entropy of task distribution).

Demo
====

Example Code
------------

This example demonstrates how to use the `quantity_and_diversity` function to compute node-level measures.

**Step 1: Import necessary libraries**

.. code-block:: python

    import pandas as pd
    from hina.construction.network_construct import get_bipartite
    from hina.individual.quantity_diversity import quantity_and_diversity

**Step 2: Define the dataset**

A dataset containing student-task interactions:

.. code-block:: python

    data = {
        'student': ['Student 1', 'Student 2', 'Student 1', \
                    'Student 1', 'Student 1','Student 2',\
                    'Student 2','Student 1','Student 2'],
        'task_category_1': ['Code 1', 'Code 1', 'Code 2', 'Code 2', 'Code 2', 'Code 3',\
                 'Code 3', 'Code 4', 'Code 4'],
        'task_category_2': ['Code A', 'Code A', 'Code A', 'Code A', 'Code A', 'Code B',\
                 'Code B', 'Code B', 'Code B']
    }
   df = pd.DataFrame(data)

**Step 3a: Construct the bipartite network**

We create a bipartite network representation of the interactions between students and task codes in category 1.

.. code-block:: python

    bipartite_graph = get_bipartite(df, 'student', 'task_category_1')
    print("Bipartite Network with First Set of Task Codes:\n", bipartite_graph)

**Step 3b: Construct an alternative bipartite network**

We create a bipartite network representation of the interactions between students and task codes in category 2.

.. code-block:: python

    bipartite_graph = get_bipartite(df, 'student', 'task_category_2')
    print("Bipartite Network with Second Set of Task Codes:\n", bipartite_graph)

**Step 4a: Compute quantity and diversity measures**

Calculate the participation quantity and diversity for each student relative to the task codes in category 1.

.. code-block:: python

    quantities, diversities = quantity_and_diversity(df, 'student', 'task_category_1')
    print("Quantities for Code Category 1:\n", quantities)
    print("Diversities for Code Category 1:\n", diversities)

**Step 4b: Compute quantity and diversity measures for alternative task codes**

Calculate the participation quantity and diversity for each student relative to the task codes in category 2.

.. code-block:: python

    quantities, diversities = quantity_and_diversity(df, 'student', 'task_category_2')
    print("Quantities for Code Category 2:\n", quantities)
    print("Diversities for Code Category 2:\n", diversities)



Example Output
--------------

.. code-block:: console

    Bipartite Network with First Set of Task Codes:
    {('Student 2', 'Code 3', 2), ('Student 1', 'Code 4', 1), ('Student 1', 'Code 2', 3), ('Student 1', 'Code 1', 1), ('Student 2', 'Code 1', 1), ('Student 2', 'Code 4', 1)}

   Bipartite Network with Second Set of Task Codes:
    {('Student 1', 'Code A', 4), ('Student 1', 'Code B', 1), ('Student 2', 'Code A', 1), ('Student 2', 'Code B', 3)}
   
   Quantities for Code Category 1:
    {'Student 2': 0.4444444444444444, 'Student 1': 0.5555555555555556}
  
   Diversities for Code Category 1:
    {'Student 2': 0.75, 'Student 1': 0.6854752972273345}
  
   Quantities for Code Category 2:
    {'Student 1': 0.5555555555555556, 'Student 2': 0.4444444444444444}
 
   Diversities for Code Category 2:
    {'Student 1': 0.7219280948873623, 'Student 2': 0.8112781244591328}

Paper Source
============

If you use this function in your work, please cite:
