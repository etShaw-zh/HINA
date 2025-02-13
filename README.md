# HINA (Heterogenous Interaction Network Analysis in Python)

HINA is a learning analytics tool that models and analyzes heterogenous interactions in learning processes. Heterogenous interactions refer to the interactions occurring between different types of entities during learning processes, such as students’ interactions with learning objects or students’ display of different behaviors coded using multimodal process data. Heterogenous interaction networks (HIN) consist of different sets of nodes and edges connecting nodes from different sets. Each node in a heterogenous interaction network (HIN) can represent any meaningful entity reflecting a certain object or construct in a learning process, such as a student, group of students, coded behavior, or learning artefact. Edges in HINs pair nodes from different sets and can reflect affiliations, associations, or interactions among the nodes for modeling a specific learning process. Heterogenous interaction network analysis (HINA) offers a flexible, adaptive, and widely applicable method to model a wide variety of interactions that can occur during the learning processes, across individual learning, group learning, and community learning. 

## Features

- **Individual-level Analysis**: Provides functions to compute the node-level measures of gauging the quantity and diversity of individuals’ interactions in the learning process. New package contributions can incorporate other node-level measures for understanding individuals’ participation patterns.
- **Dyadic Analysis**: Provides methods to identify statistically significant edges in the heterogeneous interaction network relative to multiple different null models of interaction structure, which can be specified by the user. New package contributions can incorporate other dyad-level analyses for understanding interaction patterns among pairs of nodes.
- **Mesoscale Clustering**: Provides methods for clustering nodes in a bipartite projection of the heterogeneous interaction network according to shared interaction structure, automatically learning the number of clusters from heterogeneity in the interaction data to find a mesoscale representation. New package contributions can incorporate other algorithms for understanding the mesoscale structure of the interaction network.
- **Visualization**: Provides network visualization functions for networks at the group level or cohort level that enable the user to easily project the heterogeneous interaction network onto any subset of node types (e.g. students, tasks, behavioral codes). These methods allow for the inclusion of various metadata such as inferred student clusters or contribution metrics, as well as pruning of the interaction network to identify significant interaction structure. Also enables visualization with Sankey diagrams for an alternative representation of the weighted networks. These visualizations come together with a web-based interface that enables interactions and user engagement. New package contributions can incorporate other relevant metadata for visualization, as well as other preprocessing tools for augmenting or modifying the network structure to highlight particular features.
- **Web Interface**: Includes a web-based interface for engaging with the visualizations.
- **Extensibility**: Easily incorporate additional measures, clustering methods, or visualizations.


## Installation

To install HINA, you can use `pip` from the PyPI repository:

```bash
pip install hina

HINA/
├── __init__.py
├── individual/
│   ├── __init__.py
│   ├── quantity_diversity.py    
│   └── tests/                   
│       ├── __init__.py
│       └── test_quantity_diversity.py
├── dyad/
│   ├── __init__.py
│   ├── significant_edges.py     
│   └── tests/                  
│       ├── __init__.py
│       └── test_significant_edges.py
├── mesoscale/
│   ├── __init__.py
│   ├── clustering.py            
│   └── tests/                  
│       ├── __init__.py
│       └── test_clustering.py
├── visualization/
│   ├── __init__.py
│   ├── network_visualization.py 
│   └── tests/                   
│       ├── __init__.py
│       └── test_network_visualization.py
├── app/
│   ├── __init__.py
│   ├── app.py 
│   └── tests/                   
│       ├── __init__.py
│       └── app.py
├── utils/
│   ├── __init__.py
│   ├── graph_tools.py        
│   ├── plot_tools.py          
│   └── tests/
│       ├── __init__.py
│       ├── test_graph_tools.py
│       └── test_plot_tools.py
├── data/                       
    ├── __init__.py
    └── synthetic_data.csv
