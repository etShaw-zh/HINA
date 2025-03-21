# HINA (Heterogenous Interaction Network Analysis in Python)

HINA is a learning analytics tool that models and analyzes heterogenous interactions in learning processes. Heterogenous interactions refer to the interactions occurring between different types of entities during learning processes, such as students’ interactions with learning objects or students’ display of different behaviors coded using multimodal process data. Heterogenous interaction networks (HIN) consist of different sets of nodes and edges connecting nodes from different sets. Each node in a heterogenous interaction network (HIN) can represent any meaningful entity reflecting a certain object or construct in a learning process, such as a student, group of students, coded behavior, or learning artefact. Edges in HINs pair nodes from different sets and can reflect affiliations, associations, or interactions among the nodes for modeling a specific learning process. Heterogenous interaction network analysis (HINA) offers a flexible, adaptive, and widely applicable method to model a wide variety of interactions that can occur during the learning processes, across individual learning, group learning, and community learning. 

## Table of Contents

- [Installation](#installation)
- [Modules](#modules)
  - [Individual-level Analysis](#individual-level-analysis)
  - [Dyadic Analysis](#dyadic-analysis)
  - [Mesoscale Clustering](#mesoscale-clustering)
  - [Visualization](#visualization)
  - [Web Interface](#web-interface)
  - [Extensibility](#extensibility)
- [Documentation](#documentation)
- [License](#license)
- [Citation](#citation)
- [Layout](#layout)

## Installation

pip install hina

## Modules

### [individual](https://hina.readthedocs.io/en/latest/Modules/individual.html)

- **Individual-level Analysis**: Provides functions to compute the node-level measures of gauging the quantity and diversity of individuals’ interactions in the learning process. New package contributions can incorporate other node-level measures for understanding individuals’ participation patterns.

### [dyad](https://hina.readthedocs.io/en/latest/Modules/dyad.html)

- **Dyadic Analysis**: Provides methods to identify statistically significant edges in the heterogeneous interaction network relative to multiple different null models of interaction structure, which can be specified by the user. New package contributions can incorporate other dyad-level analyses for understanding interaction patterns among pairs of nodes.

### [mesoscale](https://hina.readthedocs.io/en/latest/Modules/mesoscale.html)

- **Mesoscale Clustering**: Provides methods for clustering nodes in a bipartite projection of the heterogeneous interaction network according to shared interaction structure, automatically learning the number of clusters from heterogeneity in the interaction data to find a mesoscale representation. New package contributions can incorporate other algorithms for understanding the mesoscale structure of the interaction network.

### [visualization](https://hina.readthedocs.io/en/latest/Modules/visualization.html)

- **Visualization**: Provides network visualization functions for networks at the group level or cohort level that enable the user to easily project the heterogeneous interaction network onto any subset of node types (e.g. students, tasks, behavioral codes). These methods allow for the inclusion of various metadata such as inferred student clusters or contribution metrics, as well as pruning of the interaction network to identify significant interaction structure. New package contributions can incorporate other relevant metadata for visualization, as well as other preprocessing tools for augmenting or modifying the network structure to highlight particular features.

### [Dashboard](https://hina.readthedocs.io/en/latest/Modules/dashboard.html)

- **HINA Dashboard**: Includes a web-based interface that serves dual purposes: 1) It serves as a web-based analytical tool for conducting HINA using an intuitive drag-and-drop approach, enabling users to conduct the individual-, dyadic- and mesoscale-level analysis without programming. 2) It also functions as a learning analytics dashboard, allowing teachers and students to visualize, interpret, and communicate HINA results effectively. This dual functionality supports both data analysis and the sharing of actionable insights in an interactive and user-friendly manner, making it a versatile tool for both data analytics and teaching implementation.

- **Extensibility**: Easily incorporate additional measures, clustering methods, or visualizations.


## Documentation

Detailed documentation for each module and function is available at the link below:

### [HINA Documentation](https://hina.readthedocs.io/en/latest/)

## License 
Distributed under the MIT License. See LICENSE for more information.

## Layout
```bash

HINA/
├── __init__.py
│
├── construction/                    # Construct bipartite & tripartite networks
│   ├── __init__.py
│   ├── network_construct.py
│   └── tests/
│       ├── __init__.py
│       └── test_network_construct.py
├── individual/                      # Node-level analysis: quantity & diversity
│   ├── __init__.py
│   ├── quantity_diversity.py
│   └── tests/
│       ├── __init__.py
│       └── test_quantity_diversity.py
│
├── dyad/                            # Edge-level analysis: significant edges
│   ├── __init__.py
│   ├── significant_edges.py
│   └── tests/
│       ├── __init__.py
│       └── test_significant_edges.py
│
├── mesoscale/                       # Mesoscale clustering analysis
│   ├── __init__.py
│   ├── clustering.py
│   └── tests/
│       ├── __init__.py
│       └── test_clustering.py
│
├── visualization/                   # Network visualization utilities
│   ├── __init__.py
│   ├── network_visualization.py
│   └── tests/
│       ├── __init__.py
│       └── test_network_visualization.py
│
├── app/                              # Web-based API & frontend
│   ├── __init__.py
│   ├── api/                          # Backend API logic
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── utils.py
│   │
│   ├── tests/                        # API unit tests
│   │   ├── __init__.py
│   │   └── test_api.py
│   │
│   ├── frontend/                     # Web interface (React/TypeScript)
│       ├── src/
│           ├── components/
│           │   ├── Navbar/
│           │   │   ├── NavbarMinimalColored.tsx
│           │   ├── Webinterface/
│           │   │   ├── Webinterface.tsx
│           │
│           ├── pages/
│           │   ├── Homepage.tsx
│           │
│           ├── App.tsx
│           ├── main.tsx
│           ├── Router.tsx
│
├── utils/                            # Utility functions for graph & plotting
│   ├── __init__.py
│   ├── graph_tools.py
│   ├── plot_tools.py
│   └── tests/
│       ├── __init__.py
│       ├── test_graph_tools.py
│       └── test_plot_tools.py
│
├── data/                             # Sample datasets
│   ├── __init__.py
│   ├── synthetic_data.csv
│   └── example_dataset.xlsx


