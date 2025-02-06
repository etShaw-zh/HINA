from sknetwork.data import from_edge_list
from sknetwork.clustering import Louvain
import numpy as np
from scipy.special import loggamma
import heapq
from collections import Counter


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

    elif method == 'SBM':

        community_labels = None

    else:

        raise ValueError('Invalid clustering method')
    
    return community_labels

def bipartite_communities(G,fix_B=None):
    """
    Optimizes MDL objective to find bipartite communities in nodes corresponding to first entry in each edge of G 
        (can reverse orientation of edges in the input G to get communities in second set)
    Inputs:
        -G: weighted edge set of form {(i,j,w_ij)}, where w_ij is a positive integer
        -fix_B allows user to fix number of clusters if they wish
    returns:
        -dict of form {node:community_label} for the nodes in the first node set
        -compression ratio = (description length)/(naive description length) telling us how well the 
            inferred communities compress the network structure
    MDL objective has the following components:
        -information to transmit community labels of N1 nodes in Set 1
        -information to transmit total weight contributions across the N2 nodes from each of B communities
        -information to transmit weights of each edge from Set 1 to Set 2 (i.e. G) given these constraints
    Optimizes MDL objective with fast approximate greedy merge scheme using min heap
    """
    
    set1,set2 = set([e[0] for e in G]),set([e[1] for e in G])
    N1,N2 = len(set1),len(set2)
    W = sum([e[2] for e in G])

    cluster2nodes = {i:set([i]) for i in set1}
    node2cluster = {i:i for i in set1}
    cluster2weights = {}
    for e in G:
        i,j,w = e
        c = node2cluster[i]
        if not(c in cluster2weights): cluster2weights[c] = Counter({k:0 for k in set2})
        cluster2weights[c][j] += w
        
    def logchoose(n,k):
        """
        log binomial coefficient
        """
        return loggamma(n+1) - loggamma(k+1) - loggamma(n-k+1)

    def logmultiset(n,k):
        """
        log multiset coefficient
        """
        return logchoose(n+k-1,k)
    
    def C(B):
        """
        constants in the description length (only depend on size B of partition)
        """
        return np.log(N1) + logchoose(N1-1,B-1) + loggamma(N1) + logmultiset(N2*B,W)

    def F(r):
        """
        cluster-level term in the description length
        r is a cluster name
        """
        nr = len(cluster2nodes[r])
        weights = cluster2weights[r]
        return -loggamma(nr) + sum(logmultiset(nr,w) for w in weights.values())

    def merge_dF(r,s):
        """
        change in cluster-level terms from merging existing clusters r and s
        """
        bef = F(r) + F(s)
        nrs = len(cluster2nodes[r]) + len(cluster2nodes[s])
        weights = cluster2weights[r] + cluster2weights[s]
        aft = -loggamma(nrs) + sum(logmultiset(nrs,w) for w in weights.values())
        return aft - bef 

    past_merges = []
    for c1 in cluster2nodes:
        for c2 in cluster2nodes:
            if c1 != c2:
                dF = merge_dF(c1,c2)
                heapq.heappush(past_merges,(dF,(c1,c2)))

    H0 = C(N1) + sum(F(r) for r in cluster2nodes)
    Hs,past_partitions = [],[]
    Hs.append(H0)
    past_partitions.append(node2cluster.copy())

    B,H = N1,H0
    while B > 1:
        
        dF,pair = heapq.heappop(past_merges) 
        while not(pair[0] in cluster2nodes) or not(pair[1] in cluster2nodes):
            dF,pair = heapq.heappop(past_merges)

        c1,c2 = pair
        c12 = 'Merge_at_Beq_'+str(B)
        cluster2weights[c12] = cluster2weights[c1] + cluster2weights[c2]
        cluster2nodes[c12] = cluster2nodes[c1].union(cluster2nodes[c2])
        for i in cluster2nodes[c12]:
            node2cluster[i] = c12
        del cluster2weights[c1],cluster2weights[c2],cluster2nodes[c1],cluster2nodes[c2]
        past_partitions.append(node2cluster.copy())

        H += dF + C(B-1) - C(B)
        
        for c3 in cluster2nodes:
            if c3 != c12:
                dF = merge_dF(c3,c12)
                heapq.heappush(past_merges,(dF,(c3,c12)))
        
        Hs.append(H)
        B -= 1

        if B == fix_B:
            community_labels = {str(i[0]):str(i[1]) for i in node2cluster.items()}
            Hmdl = H
            return community_labels,Hmdl/H0
            

    best_ind = np.argmin(Hs)
    Hmdl = Hs[best_ind]
    community_labels = past_partitions[best_ind]
    community_labels = {str(i[0]):str(i[1]) for i in community_labels.items()}

    return community_labels,Hmdl/H0