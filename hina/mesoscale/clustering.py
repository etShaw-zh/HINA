from sknetwork.data import from_edge_list
from sknetwork.clustering import Louvain
import numpy as np

def cluster_nodes(G,num_clusters=None,method='modularity',nodes='All'):
    """
    compute node clusters in bipartite network using method of Feng et al 2024 
        for network aggregated over nodes in indicated node list 'nodes'
        computes for first node set (typically student nodes) in the bipartite network
    inputs:
        set of tuples G
        num_clusters is fixed # of node clusters if desired 
            defaults to None to learn # of clusters automatically
        method specifies clustering objective and optimization algorithm. 
        current options are: 
            'modularity': Barber's (2007) modularity for bipartite graphs, through sknetwork
            'SBM': Peixoto's microcanonical SBM (2014), through graph-tool
        nodes is list of node names to which we apply the clustering. 'All' includes all nodes
    returns:
        dict of form {node name:cluster label}
    """
    if nodes == 'All': 
        nodes = set(np.unique([e[0] for e in G]))
    else:
        nodes = set(nodes)

    G = set([e for e in G if e[0] in nodes])

    if method == 'modularity':
        
        e_list = list(G)
        G_b = from_edge_list(e_list, bipartite=True)
        A_b = G_b.biadjacency

        louvain = Louvain()
        louvain.fit(A_b,force_bipartite=True)

        community_labels = {stud:louvain.labels_row_[s] for s,stud in enumerate(G_b.names_row)}

    if method == 'SBM':

        community_labels = None
    return community_labels