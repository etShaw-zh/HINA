import scipy.stats as stats

def prune_edges(G,alpha=0.05,fix_deg='Set 1'):
    """
    compute edges that are statistically significant in a null model where degree
        of nodes in the set specified are fixed, as in Feng et al 2023   
    inputs:
        G is a set of tuples (i,j,w)
        alpha is desired significance level
        fix_deg fixes degrees of desired node set
            options are: 'None', 'Set 1', 'Set 2'
    returns:
        subset of G corresponding to statistically significant edges under the null model
    """

    set1,set2 = set([e[0] for e in G]),set([e[1] for e in G])
    N1,N2 = len(set1),len(set2)
    
    if fix_deg is None:

        E = sum(e[-1] for e in G)
        p = 1./(N1*N2)
        weight_threshold = stats.binom.ppf(1-alpha, E, p)

        return set([e for e in G if e[-1] > weight_threshold])

    if fix_deg == 'Set 1':

        degs = {}
        for e in G:
            i = e[0]
            if not(i in degs): degs[i] = 0
            degs[i] += e[-1]

        p = 1./N2

        return set([e for e in G if e[-1] > stats.binom.ppf(1-alpha, degs[e[0]], p)])

    if fix_deg == 'Set 2':

        degs = {}
        for e in G:
            i = e[1]
            if not(i in degs): degs[i] = 0
            degs[i] += e[-1]

        p = 1./N1

        return set([e for e in G if e[-1] > stats.binom.ppf(1-alpha, degs[e[1]], p)])