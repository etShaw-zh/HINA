visualization
+++++++++++++

Tutorial
========

The `visualization` module provides network visualization functions for networks at the group or cohort level, enabling users to project heterogeneous interaction networks onto any subset of node types (e.g., students, tasks, behavioral codes). It also includes functions for visualizing significant interaction structure and clustering results.

The module allows for the inclusion of various metadata, such as inferred student clusters or contribution metrics, and provides a web-based interface for interactive visualizations and user engagement.

Currently, the module contains the `network_visualization.py` file, which includes:

- `plot_HINA`: Visualizes a bipartite network with specified attributes and layout.
- `plot_bipartite_clusters`: Plots bipartite network with specified cluster labels indicated with node colors and positions.

Inputs include:

- **df**: A pandas DataFrame containing network data.
- **group**: A string indicating which group to filter and plot (e.g., `'All'` for the entire dataset).
- **attribute_1** and **attribute_2**: The column names representing two sets of nodes (e.g., students and tasks).
- **pruning**: Boolean or dictionary indicating whether to prune edges using statistical significance testing.
- **layout**: Layout method for node positioning (e.g., `'spring'`, `'bipartite'`, `'circular'`).
- **NetworkX_kwargs**: Additional arguments for `NetworkX` visualization.

Outputs include:

- Visualizations of the bipartite network with or without cluster labels and pruning.

Visualization
============

This module provides functions for visualizing heterogeneous interaction networks and bipartite community structure.

.. list-table:: Functions
   :header-rows: 1

   * - Function
     - Description
   * - `plot_HINA(df, group='All', attribute_1=None, attribute_2=None, ...) <#plot-hina>`_
     - Plots a bipartite network visualization with specified attributes and layout.
   * - `plot_bipartite_clusters(G, community_labels, ...) <#plot-bipartite-clusters>`_
     - Plots bipartite network with specified cluster labels indicated with node colors and positions.

Reference
---------

.. _plot-hina:

.. raw:: html

   <div id="plot-hina" class="function-header">
       <span class="class-name">function</span> <span class="function-name">plot_HINA(df, group='All', attribute_1=None, attribute_2=None, pruning=False, layout='spring', NetworkX_kwargs=None)</span> 
       <a href="../Code/network_visualization.html#plot-hina" class="source-link">[source]</a>
   </div>

**Description**:
Plots a bipartite network visualization with specified attributes and layout.

**Parameters**:

.. raw:: html

   <div class="parameter-block">
       (df, group='All', attribute_1=None, attribute_2=None, pruning=False, layout='spring', NetworkX_kwargs=None)
   </div>

   <ul class="parameter-list">
       <li><span class="param-name">df</span>: A pandas DataFrame containing network data.</li>
       <li><span class="param-name">group</span>: A string indicating which group to filter and plot (default: <code>'All'</code>).</li>
       <li><span class="param-name">attribute_1</span>: The column name for the first node set (e.g., <code>'student id'</code>).</li>
       <li><span class="param-name">attribute_2</span>: The column name for the second node set (e.g., <code>'task'</code>).</li>
       <li><span class="param-name">pruning</span>: Whether to prune edges using significance testing. Can be a boolean or a dictionary with pruning parameters (default: <code>False</code>).</li>
       <li><span class="param-name">layout</span>: Layout method for positioning nodes. Options include <code>'bipartite'</code>, <code>'spring'</code>, and <code>'circular'</code> (default: <code>'spring'</code>).</li>
       <li><span class="param-name">NetworkX_kwargs</span>: Additional arguments for NetworkX visualization (default: <code>None</code>).</li>
   </ul>

**Returns**:
  - **None**: Displays a plot of the bipartite network.

.. _plot-bipartite-clusters:

.. raw:: html

   <div id="plot-bipartite-clusters" class="function-header">
       <span class="class-name">function</span> <span class="function-name">plot_bipartite_clusters(G, community_labels, noise_scale=3, radius=20., encode_labels=False, node_labels='Set 2', edge_labels=False, scale_nodes_by_degree=False, node_scale=2000., node_kwargs={'edgecolors':'black'}, edge_kwargs={'edge_color':'black'})</span> 
       <a href="../Code/network_visualization.html#plot-bipartite-clusters" class="source-link">[source]</a>
   </div>

**Description**:
Plots bipartite network with specified cluster labels indicated with node colors and positions.

**Parameters**:

.. raw:: html

   <div class="parameter-block">
       (G, community_labels, noise_scale=3, radius=20., encode_labels=False, node_labels='Set 2', edge_labels=False, scale_nodes_by_degree=False, node_scale=2000., node_kwargs={'edgecolors':'black'}, edge_kwargs={'edge_color':'black'})
   </div>

   <ul class="parameter-list">
       <li><span class="param-name">G</span>: A bipartite edge set with tuples (node in Set 1, node in Set 2, weight).</li>
       <li><span class="param-name">community_labels</span>: A dictionary mapping nodes to their community labels.</li>
       <li><span class="param-name">noise_scale</span>: Controls node dispersion around cluster centroids (default: <code>3</code>).</li>
       <li><span class="param-name">radius</span>: Controls the radius of the community centers (default: <code>20</code>).</li>
       <li><span class="param-name">encode_labels</span>: If <code>True</code>, encodes each node label as a unique string (default: <code>False</code>).</li>
       <li><span class="param-name">node_labels</span>: Defines which set of nodes to label (default: <code>'Set 2'</code>).</li>
       <li><span class="param-name">edge_labels</span>: Whether to include edge labels (default: <code>False</code>).</li>
       <li><span class="param-name">scale_nodes_by_degree</span>: Whether to scale node size by degree (default: <code>False</code>).</li>
       <li><span class="param-name">node_scale</span>: Controls the average size of nodes (default: <code>2000</code>).</li>
       <li><span class="param-name">node_kwargs</span>: Arguments for `NetworkX` node plotting (default: <code>{'edgecolors':'black'}</code>).</li>
       <li><span class="param-name">edge_kwargs</span>: Arguments for `NetworkX` edge plotting (default: <code>{'edge_color':'black'}</code>).</li>
   </ul>

**Returns**:
  - **None**: Displays a plot of the bipartite clusters.

Demo
====

Example Code
------------

This example demonstrates how to visualize a bipartite network, clustered network, and bipartite communities.

**Step 1: Import necessary libraries**

.. code-block:: python

    import pandas as pd
    from hina.individual.quantity_diversity import get_bipartite
    from hina.mesoscale.clustering import bipartite_communities 
    from hina.visualization.network_visualization import plot_HINA, plot_bipartite_clusters

**Step 2: Load the example dataset**

.. code-block:: python

    df = pd.read_csv('synthetic_data_simple.csv')

**Step 3: Plot the bipartite network of students and tasks in all groups**

.. code-block:: python

    plot_HINA(df, attribute_1='student id', attribute_2='task', group='All', layout='spring')

**Step 4: Plot the bipartite network of students and tasks in group 5**

.. code-block:: python

    plot_HINA(df, attribute_1='student id', attribute_2='task', group=5, layout='spring')

**Step 5: Plot bipartite clusters inferred using MDL method**

.. code-block:: python

   G = get_bipartite(df,'student id','task')
   community_labels,cr = bipartite_communities(G)
   plot_bipartite_clusters(G,community_labels)

Example Output
--------------

.. code-block:: console

    *SHOW PLOTS OF OUTPUT HERE!*

Paper Source
============

If you use this function in your work, please cite:

