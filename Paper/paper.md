---
title: 'HINA: A Learning Analytics Tool for Heterogenous Interaction Network Analysis in Python'
tags:
  - Python
  - Learning Analytics
  - Heterogenous Interactions 
  - Complex Networks 
  - Dashboard 
authors:
  - name: Shihui Feng 
    orcid: 0000-0002-5572-276X
    affiliation: "1, 2"
    corresponding: true
  - name: Baiyue He
    affiliation: 2
  - name: Alec Kirkley 
    affiliation: 2,3,4
    
affiliations:
 - name: Faculty of Education, University of Hong Kong, Hong Kong, China 
   index: 1
 - name: Institute of Data Science, University of Hong Kong, Hong Kong, China 
   index: 2
 - name: Department of Urban Planning and Design, University of Hong Kong, Hong Kong, China
   index: 3
 - name: Urban Systems Institute, University of Hong Kong, Hong Kong, China
   index: 4

date: 23 March, 2025
bibliography: paper.bib



# Summary
Learning analytics is a scientific field created in response to the need for deriving meaningful insights from learning process data, 
to understand how learning occurs and to optimize learning design [@Gašević:2015]. HINA is a learning analytics tool that 
models and analyzes the relationships among different types of learning process data to uncover hidden learning strategies, 
provide learning performance indices, identify clusters, and generate dashboard visualizations.  

Heterogenous interactions refer to the connections that occur between different types of entities during learning processes, 
such as students’ interactions with learning objects [@Feng:2025] or students’ affiliations with different 
coded behaviors [@Feng:2024]. These heterogenous interactions can be modelled with heterogenous 
interaction networks (HIN) that consist of different sets of nodes, with edges only connecting nodes between different sets. 
Examples of heterogenous interaction networks in learning analytics are presented in Figure 1 below {fig:examples}. HINA offers a set of flexible and 
adaptive methods to model a wide variety of interactions that can occur during learning processes in individual and collaborative learning contexts.  

![Caption for example figure.\label{fig:example}](figure.png){ width=20% }


# Statement of need

Constructivism theory of learning emphasizes that learning occurs through students’ active interactions with 
various aspects of their environment [@Vygotsky:1978] [@Piaget:1976]. Students’ interactions with their learning environment—for example, 
engagement with designed learning artefacts or with coded latent constructs—are inherently heterogenous, and can be captured using multimodal process data. 
HINA offers analytical modules to model these heterogenous interactions and address questions at multiple levels of interest, for example: 

- How can we assess the quantity and diversity of individuals’ interactions with their designed learning environments?  

- How can we identify the interactions among pairs of nodes that are statistically significant under a suitable null model? 

- How can we identify subgroups of individuals that share similar learning strategies  indicated by their heterogenous interaction patterns? 

- How can we visualize these heterogeneous interaction networks in an interactive and informative way, using different visualization 
formats that are tailored for learning analytics applications and implementations? 


These analytical features offered by HINA can analyze multimodal process data to address a wide range of research questions in 
learning analytics. For example, studies can explore how  to gauge individual contribution based on the interactions between students and 
learning artefacts [@Feng:2025], identify subgroups of students who share similar learning strategies based on their associations with 
behavioral and cognitive constructs during learning processes [@Feng:2024], uncover significant associations among behavioral engagement in 
different modalities [@Feng:2024], or design learning analytics dashboards for the visualization of heterogenous engagement to support teaching and learning practices [@Feng:2025].  
 

HINA tailors its methods—which include brand-new algorithms for pruning, clustering, and visualization in the HIN setting—specifically for 
learning analytics researchers and teachers working with HINs derived from learning process data. This makes HINA a unique contribution to the software space that 
provides a more specialized experience than existing packages for general network analysis [@Hagberg:2008] [@Csardi:2006] or network inference [@Peixoto:2017] [@Kirkley:2024].  


# Current Modules 
- Network construction (hina.construction)  

  - Provides functions to construct Heterogeneous Interaction Networks (HINs) (see examples in Figure 1A, 1B)
  - directly from input learning process data. The methods in this module are designed to handle the typical
  - data format encountered for learning process data traces, supporting seamless integration with learning analytics workflows.  


- Individual-level analysis (hina.individual) 

  - Provides functions to compute the node-level measures of [@Feng:2025] gauging the quantity and diversity
  - of individuals’ connections to different learning constructs. Students’ group information and construct attributes
  - can be flexibly manipulated for different applications. 
 

- Dyadic-level analysis (hina.dyad) 

  - Provides methods to identify statistically significant edges in the heterogeneous interaction
    network relative to different null models of interaction structure [@Feng:2025], which can be specified by the user.  

- Mesoscale clustering (hina.mesoscale) 

  - Provides methods for clustering nodes in a heterogeneous interaction network according to shared interaction structure [@Feng:2024], 
    to automatically learn the number of clusters from heterogeneity in the interaction data to find a mesoscale representation. Utilizes a novel method
    based on data compression for parsimonious inference. If the input is a tripartite representation of heterogenous interaction network,
    the function also returns the projected bipartite networks of the related constructs of individuals within each cluster.  

- Network visualization (hina.visualization) 

  - Provides network visualization functionalities for heterogeneous interaction networks.
    Users can generate a customizable network visualization using a specified layout, allowing for the pruning of insignificant edges,
    grouping of nodes based on engagement patterns, and customization of the graph's appearance.
    Users can also visualize HINs with a novel community-based layout, emphasizing the underlying bipartite community structure.  

- Dashboard deployment (hina.app) 
  - Provides functions to deploy a dashboard that includes a web-based interface serving multiple purposes.
    1) The dashboard serves as a web-based tool for conducting learning analytics with HINA using an intuitive user interface,
    2) enabling users to conduct the individual-, dyadic- and mesoscale-level analysis available in the package without any programming.
    3) The dashboard also allows teachers and students to visualize, interpret, and communicate HINA results effectively.
    This dual functionality supports both data analysis and the sharing of actionable insights in an interactive and user-friendly manner,
    making it a versatile tool for both data analytics and teaching practice. 

# Citations

# Acknowledgements

This work was supported by the Research Grants Council of Hong Kong under 
ECS Grant No. 27605223 (Shihui Feng) and HKU Institute of Data Science Seed Fund Grant No. IDS-RSF2023-0006 (Shihui Feng, Alec Kirkley). 

# References
