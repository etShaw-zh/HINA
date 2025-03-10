Visualization
+++++++++

Source Code
------------

.. code-block:: python

  import networkx as nx
  import numpy as np
  import matplotlib.pyplot as plt
  import matplotlib.colors as mcolors
  from hina.dyad.significant_edges import prune_edges
  from hina.individual.quantity_diversity import get_bipartite

.. _plot-hina:

.. code-block:: python

    def plot_HINA(df, group='All', attribute_1=None, attribute_2=None, pruning=False, layout='spring', NetworkX_kwargs=None):
        """
        Plots a bipartite network visualization with specified attributes and layout.

        Parameters:
        - df (pd.DataFrame): Input dataframe containing the network data.
        - group (str): Group to filter and plot (default: 'All' for entire dataset).
        - attribute_1 (str): Column name for the first node set (e.g., 'student id').
        - attribute_2 (str): Column name for the second node set (e.g., 'task').
        - pruning (bool or dict): Whether to prune edges based on significance of weights. 
                                If dict, specifies parameters for pruning.
        - layout (str): Layout to use for node positioning. Supported layouts:
                        - 'bipartite': Nodes are positioned in two vertical columns.
                        - 'spring': Force-directed layout for a visually appealing arrangement.
                        - 'circular': Nodes are arranged in a circle.
        - NetworkX_kwargs (dict): Additional arguments for NetworkX visualization.

        Returns:
        - None: Displays a plot of the bipartite network.

        """
        if NetworkX_kwargs is None:
            NetworkX_kwargs = {}

        if attribute_1 is None or attribute_2 is None:
            raise ValueError("Both 'attribute_1' and 'attribute_2' must be specified.")

        if group != 'All':
            df = df[df['group'] == group]

        G_tuples = get_bipartite(df,attribute_1,attribute_2)

        G = nx.Graph()
        for e in G_tuples:
            G.add_node(e[0])
            G.add_node(e[1])
            G.add_edge(e[0], e[1], weight=e[2])

        if pruning:
            if isinstance(pruning, dict):
                significant_edges = prune_edges(G_tuples, **pruning)
            else:
                significant_edges = prune_edges(G_tuples)
            G = nx.Graph()
            for u, v, w in significant_edges:
                G.add_edge(u, v, weight=w)

        for node in G.nodes:
            if node in df[attribute_1].values:
                G.nodes[node]['type'] = 'attribute_1'
                G.nodes[node]['color'] = 'blue'
            elif node in df[attribute_2].values:
                G.nodes[node]['type'] = 'attribute_2'
                G.nodes[node]['color'] = 'grey'
            else:
                G.nodes[node]['type'] = 'unknown'
                G.nodes[node]['color'] = 'black'

        if layout == 'bipartite':
            attribute_1_nodes = {n for n, d in G.nodes(data=True) if d['type'] == 'attribute_1'}
            if not nx.is_bipartite(G):
                raise ValueError("The graph is not bipartite; check the input data.")
            pos = nx.bipartite_layout(G, attribute_1_nodes, align='vertical', scale=2, aspect_ratio=4)
        elif layout == 'spring':
            pos = nx.spring_layout(G, k=0.2)  
        elif layout == 'circular':
            pos = nx.circular_layout(G)
        else:
            raise ValueError(f"Unsupported layout: {layout}")

        max_y = max(abs(y) for _, y in pos.values())  
        label_offset = max_y * 0.03  

        node_colors = [d['color'] for _, d in G.nodes(data=True)]
        edge_widths = [d['weight'] / 15 for _, _, d in G.edges(data=True)]

        plt.figure(figsize=(12, 12))
        nx.draw(
            G,
            pos,
            with_labels=False,
            node_color=node_colors,
            width=edge_widths,
            node_size=200,
            **NetworkX_kwargs
        )

        for node, (x, y) in pos.items():
            label = str(node)
            plt.text(
                x, y + label_offset,  
                label,
                fontsize=9,
                ha='center',
                va='center',
                color='black'
            )

        plt.title(f"HINA Network Visualization: Group = {group}")
        plt.show()

.. _plot-bipartite-clusters:

.. code-block:: python
    
    def plot_bipartite_clusters(G,community_labels,noise_scale=3,radius=20.,encode_labels=False,\
                                node_labels='Set 2',edge_labels=False,\
                                scale_nodes_by_degree=False,node_scale=2000.,\
                    node_kwargs={'edgecolors':'black'},edge_kwargs={'edge_color':'black'}):
        """
        G: bipartite edge set with tuples (node in set 1, node in set 2)
        community_labels: dict of form {node:community label}
        noise_scale: tunes dispersion of nodes of type 1 around cluster centroids
        radius: tunes radius of circle of community centers
        node_labels: 'Set X' labels only set X (X = 1 or 2) nodes, and 'Both Sets' labels both sets. else, no labels 
        encode_labels: if True, encodes each node label as a unique string and retruns list showing the encoding map
        edge_labels: whether or not to include edge labels
        scale_nodes_by_degree: whether or not to scale node size by degree
        node_scale: average node size
        node_kwargs: NetworkX plot arguments for draw_networkx_nodes
        edge_kwargs: NetworkX plot arguments for draw_networkx_edges
        """
        set1 = set([str(e[0]) for e in G]) 
        set2 = set([str(e[1]) for e in G]) 
        Gnx = nx.Graph()
        Gnx.add_weighted_edges_from([(str(e[0]),str(e[1]),e[2]) for e in G])

        offset = np.random.rand()*np.pi

        B = len(set(community_labels.values())) 
        comm2ind = dict(zip(list(set(community_labels.values())),range(B)))
        
        set1_pos = {}
        for node in set1:
            c = comm2ind[community_labels[node]]
            angle = 2*np.pi*c/B + offset
            x = radius*np.cos(angle) + (2.*np.random.rand()-1.)*noise_scale
            y = radius*np.sin(angle) + (2.*np.random.rand()-1.)*noise_scale
            set1_pos[node] = (x, y)

        set2_pos = {}
        num_s2 = len(set2)
        for c,node in enumerate(set2):
            angle = 2*np.pi*c/num_s2 + offset
            x = 0.5*radius*np.cos(angle)
            y = 0.5*radius*np.sin(angle)
            set2_pos[node] = (x, y)

        pos = {**set1_pos, **set2_pos}

        comm_colors = dict(zip(list(set(community_labels.values())),list(mcolors.TABLEAU_COLORS.values())))
        color_dict = {node:comm_colors[community_labels[node]] for node in set1} | {node:'Gray' for node in set2}
        node_colors = {node:color_dict[node] for node in Gnx.nodes()}

        edge_weights = [Gnx[u][v]['weight'] for u, v in Gnx.edges()]
        max_weight = max(edge_weights)
        edge_widths = [weight / max_weight * 5 for weight in edge_weights]

        weighted_degrees = {node: sum(weight for _, _, weight in Gnx.edges(node, data='weight'))\
                            for node in Gnx.nodes()}
        if scale_nodes_by_degree:
            avg = np.mean(list(weighted_degrees.values()))
            node_sizes = {node:weighted_degrees[node]/avg*node_scale for node in Gnx.nodes()}
        else:
            node_sizes = {node:node_scale for node in Gnx.nodes()}

        plt.figure(figsize=(20, 20))

        nodes = [str(n) for n in set1] + [str(n) for n in set2]
        if encode_labels:
            codes = [i for i in range(len(nodes))]
            labelmap = dict(zip(nodes,codes))
            for node in set1:
                print('Original Label (Set 1):',node,'| Encoded Label:',labelmap[node])
            for node in set2:
                print('Original Label (Set 2):',node,'| Encoded Label:',labelmap[node])

        else:
            labelmap = dict(zip(nodes,nodes))

        shapes = {node:'o' for node in set1} | {node:'^' for node in set2}
        for node, shape in shapes.items():
            nx.draw_networkx_nodes(Gnx, pos, nodelist=[node], node_shape=shape, \
                                node_color=node_colors[node],node_size=node_sizes[node],**node_kwargs)

        nx.draw_networkx_edges(Gnx,pos,width=edge_widths,**edge_kwargs)

        label_options = {'bbox': {'facecolor': 'white', 'alpha': 1, 'edgecolor': 'black'}}
        if node_labels == 'Set 1': 
            for node in set2: labelmap[node] = ''
            nx.draw_networkx_labels(Gnx, pos, labels=labelmap, **label_options)
        elif node_labels == 'Set 2': 
            for node in set1: labelmap[node] = ''
            nx.draw_networkx_labels(Gnx, pos, labels=labelmap, **label_options)
        elif node_labels == 'Both Sets':
            nx.draw_networkx_labels(Gnx, pos, labels=labelmap, **label_options)
        
        if edge_labels:
            edge_labels = nx.get_edge_attributes(Gnx, 'weight')
            nx.draw_networkx_edge_labels(Gnx, pos, edge_labels=edge_labels)

        plt.show()
