dyad
+++++

Tutorial
========

The `dyad` module provides methods to identify statistically significant edges in heterogeneous interaction networks relative to multiple null models of interaction structure. The user can specify different null models, allowing for flexibility in analyzing dyad-level interaction patterns.

Currently, the module contains the `significant_edges.py` file, which includes the `prune_edges` function to filter statistically significant edges based on a null model.

This function evaluates edges using a binomial significance test and supports different constraints on node degrees.

Inputs:

- **G**: A list of tuples representing edges `(i, j, w)`, where `i` and `j` are nodes, and `w` is the weight or frequency of interaction.
- **alpha**: The significance level (default: `0.05`).
- **fix_deg**: Specifies which set of nodes should have fixed degrees in the null model. Options include:
 
   - `'None'`: No degree constraints.
   - `'Set 1'`: Fix weighted degrees (sum of incident edge weights) for nodes in the first set.
   - `'Set 2'`: Fix weighted degrees (sum of incident edge weights) for nodes in the second set.

Outputs:

- A subset of `G` containing only the edges whose weight is statistically significant relative to the specified null model.

The function can be extended with additional null models incorporating additional constraints.

dyad
====

This module provides functions for statistical analysis of interactions in heterogeneous networks.

.. list-table:: Functions
   :header-rows: 1

   * - Function
     - Description
   * - `prune_edges(G, alpha=0.05, fix_deg='Set 1') <#prune-edges>`_
     - Compute statistically significant edges under different null models.

Reference
---------

.. _prune-edges:

.. raw:: html

   <div id="prune-edges" class="function-header">
       <span class="class-name">function</span> <span class="function-name">prune_edges(G, alpha=0.05, fix_deg='Set 1')</span> 
       <a href="../Code/prune_edges.html#prune-edges" class="source-link">[source]</a>
   </div>

**Description**:
Compute edges that are statistically significant under a null model where the degree of nodes in a specified set is fixed, as in Feng et al. (2023).

**Parameters**:

.. raw:: html

   <div class="parameter-block">
       (G, alpha=0.05, fix_deg='Set 1')
   </div>

   <ul class="parameter-list">
       <li><span class="param-name">G</span>: A list of tuples representing the edges in the graph, where each tuple is of the form <code>(i, j, w)</code>.
           <ul>
               <li><code>i</code> and <code>j</code> are the node labels.</li>
               <li><code>w</code> is the weight (or frequency) of the edge between <code>i</code> and <code>j</code>.</li>
           </ul>
       </li>
       <li><span class="param-name">alpha</span>: The significance level for retaining edges.
           <span class="default-value">Default: <code>0.05</code></span>.
       </li>
       <li><span class="param-name">fix_deg</span>: Specifies the set of nodes whose degrees are fixed during the null model testing.
           <ul>
               <li><code>'None'</code>: No degree constraints.</li>
               <li><code>'Set 1'</code>: Fix weighted degrees (sum of incident edge weights) for nodes in the first set.</li>
               <li><code>'Set 2'</code>: Fix weighted degrees (sum of incident edge weights) for nodes in the second set.</li>
           </ul>
           <span class="default-value">Default: <code>'Set 1'</code></span>.
       </li>
   </ul>

**Returns**:
  - **set**: A set of edges that are statistically significant based on the null model.

**Notes**:
- Uses the binomial distribution to determine significance thresholds for edge weights.
- Can be extended to incorporate other dyad-level analyses for interaction networks.

Demo
====

Example Code
------------

This example demonstrates how to use the `prune_edges` function for filtering significant edges in a graph using different null models.

**Step 1: Import necessary libraries**

.. code-block:: python

    from hina.dyad.significant_edges import prune_edges

**Step 2: Define the graph**

A small weighted interaction network is defined as follows:

.. code-block:: python

    G = [('Student 1','Task 1',1),\
     ('Student 1','Task 2',2),\
     ('Student 1','Task 3',10),\
     ('Student 2','Task 1',5),\
     ('Student 2','Task 2',10),\
     ('Student 2','Task 3',20),\
     ('Student 3','Task 1',10),\
     ('Student 3','Task 2',15),\
     ('Student 3','Task 3',30)]

**Step 3: Compute significant edges with no degree fixing**

This method tests edge significance without fixing the degree of any nodes, preferring edges with higher overall weight.

.. code-block:: python

    alpha = 0.05  # Significance level
    result = prune_edges(G, alpha, fix_deg=None)

    print("Significant Edges (No Degree Fixing):", result)

**Step 4: Compute significant edges with fixed degrees for Set 1**

This method tests edge significance while fixing weighted degrees for nodes in "Set 1", preferring edges whose weight is high relative to other edges attached to the same Set 1 node.

.. code-block:: python

    result_set1 = prune_edges(G, alpha, fix_deg='Set 1')

    print("Significant Edges (Fixing Degree for Set 1):", result_set1)

**Step 5: Compute significant edges with fixed degrees for Set 2**

This method tests edge significance while fixing weighted degrees for nodes in "Set 2", preferring edges whose weight is high relative to other edges attached to the same Set 2 node.

.. code-block:: python

    result_set2 = prune_edges(G, alpha, fix_deg='Set 2')

    print("Significant Edges (Fixing Degree for Set 2):", result_set2)

Example Output
--------------

The function outputs a set of edges that are statistically significant under the given null model.

.. code-block:: console

    Significant Edges (No Degree Fixing): 
     {('Student 2', 'Task 3', 20), ('Student 3', 'Task 3', 30)} 

    Significant Edges (Fixing Degree for Set 1): 
     {('Student 2', 'Task 3', 20), ('Student 3', 'Task 3', 30), ('Student 1', 'Task 3', 10)} 
    
    Significant Edges (Fixing Degree for Set 2): 
     {('Student 3', 'Task 3', 30), ('Student 3', 'Task 2', 15), ('Student 3', 'Task 1', 10)} 

Paper Source
============

If you use this function in your work, please cite:

