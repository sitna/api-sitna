export default new Map([['http://schemas.opengis.net/iso/19139/20070417/gmd/gmd.xsd',`
<xs:schema targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gmd="http://www.isotc211.org/2005/gmd" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:include schemaLocation="metadataApplication.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
</xs:schema>
`],['http://schemas.opengis.net/gml/3.2.1/gml.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:gml:3.2.2">gml.xsd</appinfo>
		<documentation>
			GML is an OGC Standard.
			Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
			To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<!-- ====================================================================== -->
	<include schemaLocation="dynamicFeature.xsd"/>
	<include schemaLocation="topology.xsd"/>
	<include schemaLocation="coverage.xsd"/>
	<include schemaLocation="coordinateReferenceSystems.xsd"/>
	<include schemaLocation="observation.xsd"/>
	<include schemaLocation="temporalReferenceSystems.xsd"/>
	<include schemaLocation="deprecatedTypes.xsd"/>
	<!-- ====================================================================== -->
</schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/metadataApplication.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This metadataApplication.xsd schema implements the UML conceptual schema defined in A.2.12 of ISO 19115:2003. It contains the implementation of the class: MD_ApplicationSchemaInformation.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="metadataEntity.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="AbstractDS_Aggregate_Type" abstract="true">
		<xs:annotation>
			<xs:documentation>Identifiable collection of datasets</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="composedOf" type="gmd:DS_DataSet_PropertyType" maxOccurs="unbounded"/>
					<xs:element name="seriesMetadata" type="gmd:MD_Metadata_PropertyType" maxOccurs="unbounded"/>
					<xs:element name="subset" type="gmd:DS_Aggregate_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="superset" type="gmd:DS_Aggregate_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractDS_Aggregate" type="gmd:AbstractDS_Aggregate_Type" abstract="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_Aggregate_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractDS_Aggregate"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DS_DataSet_Type">
		<xs:annotation>
			<xs:documentation>Identifiable collection of data</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="has" type="gmd:MD_Metadata_PropertyType" maxOccurs="unbounded"/>
					<xs:element name="partOf" type="gmd:DS_Aggregate_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DS_DataSet" type="gmd:DS_DataSet_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_DataSet_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_DataSet"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DS_OtherAggregate_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDS_Aggregate_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DS_OtherAggregate" type="gmd:DS_OtherAggregate_Type" substitutionGroup="gmd:AbstractDS_Aggregate"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_OtherAggregate_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_OtherAggregate"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DS_Series_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDS_Aggregate_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DS_Series" type="gmd:DS_Series_Type" substitutionGroup="gmd:AbstractDS_Aggregate"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_Series_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_Series"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DS_Initiative_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDS_Aggregate_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DS_Initiative" type="gmd:DS_Initiative_Type" substitutionGroup="gmd:AbstractDS_Aggregate"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_Initiative_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_Initiative"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DS_Platform_Type">
		<xs:complexContent>
			<xs:extension base="gmd:DS_Series_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DS_Platform" type="gmd:DS_Platform_Type" substitutionGroup="gmd:DS_Series"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_Platform_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_Platform"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DS_Sensor_Type">
		<xs:complexContent>
			<xs:extension base="gmd:DS_Series_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DS_Sensor" type="gmd:DS_Sensor_Type" substitutionGroup="gmd:DS_Series"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_Sensor_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_Sensor"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DS_ProductionSeries_Type">
		<xs:complexContent>
			<xs:extension base="gmd:DS_Series_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DS_ProductionSeries" type="gmd:DS_ProductionSeries_Type" substitutionGroup="gmd:DS_Series"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_ProductionSeries_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_ProductionSeries"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DS_StereoMate_Type">
		<xs:complexContent>
			<xs:extension base="gmd:DS_OtherAggregate_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DS_StereoMate" type="gmd:DS_StereoMate_Type" substitutionGroup="gmd:DS_OtherAggregate"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_StereoMate_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_StereoMate"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/gml/3.2.1/dynamicFeature.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:dynamicFeature:3.2.2">dynamicFeature.xsd</appinfo>
		<documentation>See ISO/DIS 19136 15.6.
A number of types and relationships are defined to represent the time-varying properties of geographic features. 
In a comprehensive treatment of spatiotemporal modeling, Langran (see Bibliography) distinguished three principal temporal entities: states, events, and evidence; the schema specified in the following Subclauses incorporates elements for each.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="feature.xsd"/>
	<include schemaLocation="direction.xsd"/>
	<element name="dataSource" type="gml:StringOrRefType">
		<annotation>
			<documentation>Evidence is represented by a simple gml:dataSource or gml:dataSourceReference property that indicates the source of the temporal data. The remote link attributes of the gml:dataSource element have been deprecated along with its current type.</documentation>
		</annotation>
	</element>
	<element name="dataSourceReference" type="gml:ReferenceType">
		<annotation>
			<documentation>Evidence is represented by a simple gml:dataSource or gml:dataSourceReference property that indicates the source of the temporal data.</documentation>
		</annotation>
	</element>
	<group name="dynamicProperties">
		<annotation>
			<documentation>A convenience group. This allows an application schema developer to include dynamic properties in a content model in a standard fashion.</documentation>
		</annotation>
		<sequence>
			<element ref="gml:validTime" minOccurs="0"/>
			<element ref="gml:history" minOccurs="0"/>
			<element ref="gml:dataSource" minOccurs="0"/>
			<element ref="gml:dataSourceReference" minOccurs="0"/>
		</sequence>
	</group>
	<element name="DynamicFeature" type="gml:DynamicFeatureType" substitutionGroup="gml:AbstractFeature">
		<annotation>
			<documentation>States are captured by time-stamped instances of a feature. The content model extends the standard gml:AbstractFeatureType with the gml:dynamicProperties model group.
Each time-stamped instance represents a 'snapshot' of a feature. The dynamic feature classes will normally be extended to suit particular applications.  A dynamic feature bears either a time stamp or a history.</documentation>
		</annotation>
	</element>
	<complexType name="DynamicFeatureType">
		<complexContent>
			<extension base="gml:AbstractFeatureType">
				<group ref="gml:dynamicProperties"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="DynamicFeatureCollection" type="gml:DynamicFeatureCollectionType" substitutionGroup="gml:DynamicFeature">
		<annotation>
			<documentation>A gml:DynamicFeatureCollection is a feature collection that has a gml:validTime property (i.e. is a snapshot of the feature collection) or which has a gml:history property that contains one or more gml:AbstractTimeSlices each of which contain values of the time varying properties of the feature collection.  Note that the gml:DynamicFeatureCollection may be one of the following:
1.	A feature collection which consists of static feature members (members do not change in time) but which has properties of the collection object as a whole that do change in time .  
2.	A feature collection which consists of dynamic feature members (the members are gml:DynamicFeatures) but which also has properties of the collection as a whole that vary in time.</documentation>
		</annotation>
	</element>
	<complexType name="DynamicFeatureCollectionType">
		<complexContent>
			<extension base="gml:DynamicFeatureType">
				<sequence>
					<element ref="gml:dynamicMembers"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="dynamicMembers" type="gml:DynamicFeatureMemberType"/>
	<complexType name="DynamicFeatureMemberType">
		<complexContent>
			<extension base="gml:AbstractFeatureMemberType">
				<sequence>
					<element ref="gml:DynamicFeature" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AssociationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractTimeSlice" type="gml:AbstractTimeSliceType" abstract="true" substitutionGroup="gml:AbstractGML">
		<annotation>
			<documentation>To describe an event — an action that occurs at an instant or over an interval of time — GML provides the gml:AbtractTimeSlice element. A timeslice encapsulates the time-varying properties of a dynamic feature -- it shall be extended to represent a time stamped projection of a specific feature. The gml:dataSource property describes how the temporal data was acquired.
A gml:AbstractTimeSlice instance is a GML object that encapsulates updates of the dynamic—or volatile—properties that reflect some change event; it thus includes only those feature properties that have actually changed due to some process.
gml:AbstractTimeSlice basically provides a facility for attribute-level time stamping, in contrast to the object-level time stamping of dynamic feature instances. 
The time slice can thus be viewed as event or process-oriented, whereas a snapshot is more state or structure-oriented. A timeslice has richer causality, whereas a snapshot merely portrays the status of the whole. 
</documentation>
		</annotation>
	</element>
	<complexType name="AbstractTimeSliceType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractGMLType">
				<sequence>
					<element ref="gml:validTime"/>
					<element ref="gml:dataSource" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="history" type="gml:HistoryPropertyType">
		<annotation>
			<documentation>A generic sequence of events constitute a gml:history of an object.
The gml:history element contains a set of elements in the substitution group headed by the abstract element gml:AbstractTimeSlice, representing the time-varying properties of interest. The history property of a dynamic feature associates a feature instance with a sequence of time slices (i.e. change events) that encapsulate the evolution of the feature.</documentation>
		</annotation>
	</element>
	<complexType name="HistoryPropertyType">
		<sequence>
			<element ref="gml:AbstractTimeSlice" maxOccurs="unbounded"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/topology.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:topology:3.2.2">topology.xsd</appinfo>
		<documentation>See ISO/DIS 19136 Clause 14.
Topology is the branch of mathematics describing the properties of objects which are invariant under continuous deformation. For example, a circle is topologically equivalent to an ellipse because one can be transformed into the other by stretching. In geographic modelling, the foremost use of topology is in accelerating computational geometry. The constructs of topology allow characterisation of the spatial relationships between objects using simple combinatorial or algebraic algorithms. Topology, realised by the appropriate geometry, also allows a compact and unambiguous mechanism for expressing shared geometry among geographic features.
There are four instantiable classes of primitive topology objects, one for each dimension up to 3D. In addition, topological complexes are supported, too. 
There is strong symmetry in the (topological boundary and coboundary) relationships between topology primitives of adjacent dimensions. Topology primitives are bounded by directed primitives of one lower dimension. The coboundary of each topology primitive is formed from directed topology primitives of one higher dimension.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
  <include schemaLocation="gml.xsd"/>
  <include schemaLocation="geometryComplexes.xsd"/>
  <complexType name="AbstractTopologyType" abstract="true">
    <annotation>
      <documentation>This abstract type supplies the root or base type for all topological elements including primitives and complexes. It inherits AbstractGMLType and hence can be identified using the gml:id attribute.</documentation>
    </annotation>
    <complexContent>
      <extension base="gml:AbstractGMLType"/>
    </complexContent>
  </complexType>
  <element name="AbstractTopology" type="gml:AbstractTopologyType" abstract="true" substitutionGroup="gml:AbstractGML"/>
  <complexType name="AbstractTopoPrimitiveType" abstract="true">
    <complexContent>
      <extension base="gml:AbstractTopologyType"/>
    </complexContent>
  </complexType>
  <element name="AbstractTopoPrimitive" type="gml:AbstractTopoPrimitiveType" abstract="true" substitutionGroup="gml:AbstractTopology">
    <annotation>
      <documentation>gml:AbstractTopoPrimitive acts as the base type for all topological primitives. Topology primitives are the atomic (smallest possible) units of a topology complex. 
Each topology primitive may contain references to other topology primitives of codimension 2 or more (gml:isolated). Conversely, nodes may have faces as containers and nodes and edges may have solids as containers (gml:container).</documentation>
    </annotation>
  </element>
  <complexType name="NodeOrEdgePropertyType">
    <choice minOccurs="0">
      <element ref="gml:Node"/>
      <element ref="gml:Edge"/>
    </choice>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <complexType name="NodePropertyType">
    <choice minOccurs="0">
      <element ref="gml:Node"/>
    </choice>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <complexType name="FaceOrTopoSolidPropertyType">
    <choice minOccurs="0">
      <element ref="gml:Face"/>
      <element ref="gml:TopoSolid"/>
    </choice>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <complexType name="TopoSolidPropertyType">
    <choice minOccurs="0">
      <element ref="gml:TopoSolid"/>
    </choice>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <complexType name="NodeType">
    <complexContent>
      <extension base="gml:AbstractTopoPrimitiveType">
        <sequence>
          <element name="container" type="gml:FaceOrTopoSolidPropertyType" minOccurs="0"/>
          <element ref="gml:directedEdge" minOccurs="0" maxOccurs="unbounded">
            <annotation>
              <documentation>In the case of planar topology, a gml:Node must have a clockwise sequence of gml:directedEdge properties, to ensure a lossless topology representation as defined by Kuijpers, et. al. (see OGC 05-102 Topology IPR).</documentation>
            </annotation>
          </element>
          <element ref="gml:pointProperty" minOccurs="0"/>
        </sequence>
        <attributeGroup ref="gml:AggregationAttributeGroup"/>
      </extension>
    </complexContent>
  </complexType>
  <element name="Node" type="gml:NodeType" substitutionGroup="gml:AbstractTopoPrimitive">
    <annotation>
      <documentation>gml:Node represents the 0-dimensional primitive.
The optional coboundary of a node (gml:directedEdge) is a sequence of directed edges which are incident on this node. Edges emanating from this node appear in the node coboundary with a negative orientation. 
If provided, the aggregationType attribute shall have the value "sequence".
A node may optionally be realised by a 0-dimensional geometric primitive (gml:pointProperty).</documentation>
    </annotation>
  </element>
  <element name="directedNode" type="gml:DirectedNodePropertyType">
    <annotation>
      <documentation>A gml:directedNode property element describes the boundary of topology edges and is used in the support of topological point features via the gml:TopoPoint expression, see below. The orientation attribute of type gml:SignType expresses the sense in which the included node is used: start ("-") or end ("+") node.</documentation>
    </annotation>
  </element>
  <complexType name="DirectedNodePropertyType">
    <sequence minOccurs="0">
      <element ref="gml:Node"/>
    </sequence>
    <attribute name="orientation" type="gml:SignType" default="+"/>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <complexType name="EdgeType">
    <complexContent>
      <extension base="gml:AbstractTopoPrimitiveType">
        <sequence>
          <element name="container" type="gml:TopoSolidPropertyType" minOccurs="0"/>
          <element ref="gml:directedNode" minOccurs="2" maxOccurs="2"/>
          <element ref="gml:directedFace" minOccurs="0" maxOccurs="unbounded"/>
          <element ref="gml:curveProperty" minOccurs="0"/>
        </sequence>
        <attributeGroup ref="gml:AggregationAttributeGroup"/>
      </extension>
    </complexContent>
  </complexType>
  <element name="Edge" type="gml:EdgeType" substitutionGroup="gml:AbstractTopoPrimitive">
    <annotation>
      <documentation>gml:Edge represents the 1-dimensional primitive.
The topological boundary of an Edge (gml:directedNode) consists of a negatively directed start Node and a positively directed end Node.   
The optional coboundary of an edge (gml:directedFace) is a circular sequence of directed faces which are incident on this edge in document order. In the 2D case, the orientation of the face on the left of the edge is "+"; the orientation of the face on the right on its right is "-". 
If provided, the aggregationType attribute shall have the value "sequence".
An edge may optionally be realised by a 1-dimensional geometric primitive (gml:curveProperty).</documentation>
    </annotation>
  </element>
  <element name="directedEdge" type="gml:DirectedEdgePropertyType">
    <annotation>
      <documentation>A gml:directedEdge property element describes the boundary of topology faces, the coBoundary of topology nodes and is used in the support of topological line features via the gml:TopoCurve expression, see below. The orientation attribute of type gml:SignType expresses the sense in which the included edge is used, i.e. forward or reverse.</documentation>
    </annotation>
  </element>
  <complexType name="DirectedEdgePropertyType">
    <sequence minOccurs="0">
      <element ref="gml:Edge"/>
    </sequence>
    <attribute name="orientation" type="gml:SignType" default="+"/>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <complexType name="FaceType">
    <complexContent>
      <extension base="gml:AbstractTopoPrimitiveType">
        <sequence>
          <element name="isolated" type="gml:NodePropertyType" minOccurs="0" maxOccurs="unbounded"/>
          <element ref="gml:directedEdge" maxOccurs="unbounded"/>
          <element ref="gml:directedTopoSolid" minOccurs="0" maxOccurs="2"/>
          <element ref="gml:surfaceProperty" minOccurs="0"/>
        </sequence>
        <attributeGroup ref="gml:AggregationAttributeGroup"/>
        <attribute name="universal" type="boolean" use="optional" default="false">
          <annotation>
            <documentation>If the topological representation exists an unbounded manifold (e.g. Euclidean plane), a gml:Face must indicate whether it is a universal face or not, to ensure a lossless topology representation as defined by Kuijpers, et. al. (see OGC 05-102 Topology IPR). The optional universal attribute of type boolean is used to indicate this. NOTE The universal face is normally not part of any feature, and is used to represent the unbounded portion of the data set. Its interior boundary (it has no exterior boundary) would normally be considered the exterior boundary of the map represented by the data set. </documentation>
          </annotation>
        </attribute>
      </extension>
    </complexContent>
  </complexType>
  <element name="Face" type="gml:FaceType" substitutionGroup="gml:AbstractTopoPrimitive">
    <annotation>
      <documentation>gml:Face represents the 2-dimensional topology primitive.
The topological boundary of a face (gml:directedEdge) consists of a sequence of directed edges. If provided, the aggregationType attribute shall have the value "sequence".
The optional coboundary of a face (gml:directedTopoSolid) is a pair of directed solids which are bounded by this face. A positively directed solid corresponds to a solid which lies in the direction of the negatively directed normal to the face in any geometric realisation. 
A face may optionally be realised by a 2-dimensional geometric primitive (gml:surfaceProperty).</documentation>
    </annotation>
  </element>
  <element name="directedFace" type="gml:DirectedFacePropertyType">
    <annotation>
      <documentation>The gml:directedFace property element describes the boundary of topology solids, in the coBoundary of topology edges and is used in the support of surface features via the gml:TopoSurface expression, see below. The orientation attribute of type gml:SignType expresses the sense in which the included face is used i.e. inward or outward with respect to the surface normal in any geometric realisation.</documentation>
    </annotation>
  </element>
  <complexType name="DirectedFacePropertyType">
    <sequence minOccurs="0">
      <element ref="gml:Face"/>
    </sequence>
    <attribute name="orientation" type="gml:SignType" default="+"/>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <complexType name="TopoSolidType">
    <complexContent>
      <extension base="gml:AbstractTopoPrimitiveType">
        <sequence>
          <element name="isolated" type="gml:NodeOrEdgePropertyType" minOccurs="0" maxOccurs="unbounded"/>
          <element ref="gml:directedFace" maxOccurs="unbounded"/>
          <element ref="gml:solidProperty" minOccurs="0"/>
        </sequence>
        <attributeGroup ref="gml:AggregationAttributeGroup"/>
        <attribute name="universal" type="boolean" use="optional" default="false">
          <annotation>
            <documentation>A gml:TopoSolid must indicate whether it is a universal topo-solid or not, to ensure a lossless topology representation as defined by Kuijpers, et. al. (see OGC 05-102 Topology IPR). The optional universal attribute of type boolean is used to indicate this and the default is fault. NOTE The universal topo-solid is normally not part of any feature, and is used to represent the unbounded portion of the data set. Its interior boundary (it has no exterior boundary) would normally be considered the exterior boundary of the data set.</documentation>
          </annotation>
        </attribute>
      </extension>
    </complexContent>
  </complexType>
  <element name="TopoSolid" type="gml:TopoSolidType" substitutionGroup="gml:AbstractTopoPrimitive">
    <annotation>
      <documentation>gml:TopoSolid represents the 3-dimensional topology primitive. 
The topological boundary of a solid (gml:directedFace) consists of a set of directed faces.
A solid may optionally be realised by a 3-dimensional geometric primitive (gml:solidProperty).</documentation>
    </annotation>
  </element>
  <element name="directedTopoSolid" type="gml:DirectedTopoSolidPropertyType">
    <annotation>
      <documentation>The gml:directedSolid property element describes the coBoundary of topology faces and is used in the support of volume features via the gml:TopoVolume expression, see below. The orientation attribute of type gml:SignType expresses the sense in which the included solid appears in the face coboundary. In the context of a gml:TopoVolume the orientation attribute has no meaning.</documentation>
    </annotation>
  </element>
  <complexType name="DirectedTopoSolidPropertyType">
    <sequence minOccurs="0">
      <element ref="gml:TopoSolid"/>
    </sequence>
    <attribute name="orientation" type="gml:SignType" default="+"/>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <complexType name="TopoPointType">
    <complexContent>
      <extension base="gml:AbstractTopologyType">
        <sequence>
          <element ref="gml:directedNode"/>
        </sequence>
      </extension>
    </complexContent>
  </complexType>
  <element name="TopoPoint" type="gml:TopoPointType">
    <annotation>
      <documentation>The intended use of gml:TopoPoint is to appear within a point feature to express the structural and possibly geometric relationships of this feature to other features via shared node definitions.</documentation>
    </annotation>
  </element>
  <complexType name="TopoPointPropertyType">
    <sequence>
      <element ref="gml:TopoPoint"/>
    </sequence>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <element name="topoPointProperty" type="gml:TopoPointPropertyType">
    <annotation>
      <documentation>The gml:topoPointProperty property element may be used in features to express their relationship to the referenced topology node.</documentation>
    </annotation>
  </element>
  <complexType name="TopoCurveType">
    <complexContent>
      <extension base="gml:AbstractTopologyType">
        <sequence>
          <element ref="gml:directedEdge" maxOccurs="unbounded"/>
        </sequence>
        <attributeGroup ref="gml:AggregationAttributeGroup"/>
      </extension>
    </complexContent>
  </complexType>
  <element name="TopoCurve" type="gml:TopoCurveType">
    <annotation>
      <documentation>gml:TopoCurve represents a homogeneous topological expression, a sequence of directed edges, which if realised are isomorphic to a geometric curve primitive. The intended use of gml:TopoCurve is to appear within a line feature to express the structural and geometric relationships of this feature to other features via the shared edge definitions.
If provided, the aggregationType attribute shall have the value "sequence".</documentation>
    </annotation>
  </element>
  <complexType name="TopoCurvePropertyType">
    <sequence>
      <element ref="gml:TopoCurve"/>
    </sequence>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <element name="topoCurveProperty" type="gml:TopoCurvePropertyType">
    <annotation>
      <documentation>The gml:topoCurveProperty property element may be used in features to express their relationship to the referenced topology edges.</documentation>
    </annotation>
  </element>
  <complexType name="TopoSurfaceType">
    <complexContent>
      <extension base="gml:AbstractTopologyType">
        <sequence>
          <element ref="gml:directedFace" maxOccurs="unbounded"/>
        </sequence>
        <attributeGroup ref="gml:AggregationAttributeGroup"/>
      </extension>
    </complexContent>
  </complexType>
  <element name="TopoSurface" type="gml:TopoSurfaceType">
    <annotation>
      <documentation>gml:TopoSurface represents a homogeneous topological expression, a set of directed faces, which if realised are isomorphic to a geometric surface primitive. The intended use of gml:TopoSurface is to appear within a surface feature to express the structural and possibly geometric relationships of this surface feature to other features via the shared face definitions.</documentation>
    </annotation>
  </element>
  <complexType name="TopoSurfacePropertyType">
    <sequence>
      <element ref="gml:TopoSurface"/>
    </sequence>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <element name="topoSurfaceProperty" type="gml:TopoSurfacePropertyType">
    <annotation>
      <documentation>The gml:topoSurfaceProperty property element may be used in features to express their relationship to the referenced topology faces.</documentation>
    </annotation>
  </element>
  <complexType name="TopoVolumeType">
    <complexContent>
      <extension base="gml:AbstractTopologyType">
        <sequence>
          <element ref="gml:directedTopoSolid" maxOccurs="unbounded"/>
        </sequence>
        <attributeGroup ref="gml:AggregationAttributeGroup"/>
      </extension>
    </complexContent>
  </complexType>
  <element name="TopoVolume" type="gml:TopoVolumeType">
    <annotation>
      <documentation>gml:TopoVolume represents a homogeneous topological expression, a set of directed topologic solids, which if realised are isomorphic to a geometric solid primitive. The intended use of gml:TopoVolume is to appear within a solid feature to express the structural and geometric relationships of this solid feature to other features via the shared solid definitions.</documentation>
    </annotation>
  </element>
  <complexType name="TopoVolumePropertyType">
    <sequence>
      <element ref="gml:TopoVolume"/>
    </sequence>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <element name="topoVolumeProperty" type="gml:TopoVolumePropertyType">
    <annotation>
      <documentation>The gml:topoVolumeProperty element may be used in features to express their relationship to the referenced topology volume.</documentation>
    </annotation>
  </element>
  <complexType name="TopoComplexType">
    <complexContent>
      <extension base="gml:AbstractTopologyType">
        <sequence>
          <element ref="gml:maximalComplex"/>
          <element ref="gml:superComplex" minOccurs="0" maxOccurs="unbounded"/>
          <element ref="gml:subComplex" minOccurs="0" maxOccurs="unbounded"/>
          <element ref="gml:topoPrimitiveMember" minOccurs="0" maxOccurs="unbounded"/>
          <element ref="gml:topoPrimitiveMembers" minOccurs="0"/>
        </sequence>
        <attribute name="isMaximal" type="boolean" default="false"/>
        <attributeGroup ref="gml:AggregationAttributeGroup"/>
      </extension>
    </complexContent>
  </complexType>
  <element name="TopoComplex" type="gml:TopoComplexType" substitutionGroup="gml:AbstractTopology">
    <annotation>
      <documentation>gml:TopoComplex is a collection of topological primitives.
Each complex holds a reference to its maximal complex (gml:maximalComplex) and optionally to sub- or super-complexes (gml:subComplex, gml:superComplex). 
A topology complex contains its primitive and sub-complex members.
</documentation>
    </annotation>
  </element>
  <element name="subComplex" type="gml:TopoComplexPropertyType">
    <annotation>
      <documentation>The property elements gml:subComplex, gml:superComplex and gml:maximalComplex provide an encoding for relationships between topology complexes as described for gml:TopoComplex above.</documentation>
    </annotation>
  </element>
  <element name="superComplex" type="gml:TopoComplexPropertyType">
    <annotation>
      <documentation>The property elements gml:subComplex, gml:superComplex and gml:maximalComplex provide an encoding for relationships between topology complexes as described for gml:TopoComplex above.</documentation>
    </annotation>
  </element>
  <element name="maximalComplex" type="gml:TopoComplexPropertyType">
    <annotation>
      <documentation>The property elements gml:subComplex, gml:superComplex and gml:maximalComplex provide an encoding for relationships between topology complexes as described for gml:TopoComplex above.</documentation>
    </annotation>
  </element>
  <element name="topoPrimitiveMember" type="gml:TopoPrimitiveMemberType">
    <annotation>
      <documentation>The gml:topoPrimitiveMember property element encodes for the relationship between a topology complex and a single topology primitive.</documentation>
    </annotation>
  </element>
  <complexType name="TopoPrimitiveMemberType">
    <sequence minOccurs="0">
      <element ref="gml:AbstractTopoPrimitive"/>
    </sequence>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <element name="topoPrimitiveMembers" type="gml:TopoPrimitiveArrayAssociationType">
    <annotation>
      <documentation>The gml:topoPrimitiveMembers property element encodes the relationship between a topology complex and an arbitrary number of topology primitives.</documentation>
    </annotation>
  </element>
  <complexType name="TopoPrimitiveArrayAssociationType">
    <sequence minOccurs="0" maxOccurs="unbounded">
      <element ref="gml:AbstractTopoPrimitive"/>
    </sequence>
    <attributeGroup ref="gml:OwnershipAttributeGroup"/>
  </complexType>
  <complexType name="TopoComplexPropertyType">
    <sequence minOccurs="0">
      <element ref="gml:TopoComplex"/>
    </sequence>
    <attributeGroup ref="gml:AssociationAttributeGroup"/>
  </complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/coverage.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:coverage:3.2.2">coverage.xsd</appinfo>
		<documentation>See ISO/DIS 19136 20.3.
A coverage incorporates a mapping from a spatiotemporal domain to a range set, the latter providing the set in which the attribute values live.  The range set may be an arbitrary set including discrete lists, integer or floating point ranges, and multi-dimensional vector spaces.
A coverage can be viewed as the graph of the coverage function f:A à B, that is as the set of ordered pairs {(x, f(x)) | where x is in A}. This view is especially applicable to the GML encoding of a coverage.  In the case of a discrete coverage, the domain set A is partitioned into a collection of subsets (typically a disjoint collection) A = UAi and the function f is constant on each Ai. For a spatial domain, the Ai are geometry elements, hence the coverage can be viewed as a collection of (geometry,value) pairs, where the value is an element of the range set.  If the spatial domain A is a topological space then the coverage can be viewed as a collection of (topology,value) pairs, where the topology element in the pair is a topological n-chain (in GML terms this is a gml:TopoPoint, gml:TopoCurve, gml:TopoSurface or gml:TopoSolid). 
A coverage is implemented as a GML feature. We can thus speak of a "temperature distribution feature", or a "remotely sensed image feature", or a "soil distribution feature".
As is the case for any GML object, a coverage object may also be the value of a property of a feature.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="feature.xsd"/>
	<include schemaLocation="valueObjects.xsd"/>
	<include schemaLocation="grids.xsd"/>
	<include schemaLocation="geometryAggregates.xsd"/>
	<complexType name="AbstractCoverageType" abstract="true">
		<annotation>
			<documentation>The base type for coverages is gml:AbstractCoverageType. The basic elements of a coverage can be seen in this content model: the coverage contains gml:domainSet and gml:rangeSet properties. The gml:domainSet property describes the domain of the coverage and the gml:rangeSet property describes the range of the coverage.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractFeatureType">
				<sequence>
					<element ref="gml:domainSet"/>
					<element ref="gml:rangeSet"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractCoverage" type="gml:AbstractCoverageType" abstract="true" substitutionGroup="gml:AbstractFeature">
		<annotation>
			<documentation>This element serves as the head of a substitution group which may contain any coverage whose type is derived from gml:AbstractCoverageType.  It may act as a variable in the definition of content models where it is required to permit any coverage to be valid.</documentation>
		</annotation>
	</element>
	<complexType name="DiscreteCoverageType">
		<complexContent>
			<extension base="gml:AbstractCoverageType">
				<sequence>
					<element ref="gml:coverageFunction" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractDiscreteCoverage" type="gml:DiscreteCoverageType" abstract="true" substitutionGroup="gml:AbstractCoverage">
		<annotation>
			<documentation>A discrete coverage consists of a domain set, range set and optionally a coverage function. The domain set consists of either spatial or temporal geometry objects, finite in number. The range set is comprised of a finite number of attribute values each of which is associated to every direct position within any single spatiotemporal object in the domain. In other words, the range values are constant on each spatiotemporal object in the domain. This coverage function maps each element from the coverage domain to an element in its range. The coverageFunction element describes the mapping function.
This element serves as the head of a substitution group which may contain any discrete coverage whose type is derived from gml:DiscreteCoverageType.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractContinuousCoverageType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractCoverageType">
				<sequence>
					<element ref="gml:coverageFunction" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractContinuousCoverage" type="gml:AbstractContinuousCoverageType" abstract="true" substitutionGroup="gml:AbstractFeature">
		<annotation>
			<documentation>A continuous coverage as defined in ISO 19123 is a coverage that can return different values for the same feature attribute at different direct positions within a single spatiotemporal object in its spatiotemporal domain. The base type for continuous coverages is AbstractContinuousCoverageType.
The coverageFunction element describes the mapping function. 
The abstract element gml:AbstractContinuousCoverage serves as the head of a substitution group which may contain any continuous coverage whose type is derived from gml:AbstractContinuousCoverageType.</documentation>
		</annotation>
	</element>
	<element name="domainSet" type="gml:DomainSetType">
		<annotation>
			<documentation>The gml:domainSet property element describes the spatio-temporal region of interest, within which the coverage is defined. Its content model is given by gml:DomainSetType.
The value of the domain is thus a choice between a gml:AbstractGeometry and a gml:AbstractTimeObject.  In the instance these abstract elements will normally be substituted by a geometry complex or temporal complex, to represent spatial coverages and time-series, respectively.  
The presence of the gml:AssociationAttributeGroup means that domainSet follows the usual GML property model and may use the xlink:href attribute to point to the domain, as an alternative to describing the domain inline. Ownership semantics may be provided using the gml:OwnershipAttributeGroup.
</documentation>
		</annotation>
	</element>
	<complexType name="DomainSetType">
		<sequence minOccurs="0">
			<choice>
				<element ref="gml:AbstractGeometry"/>
				<element ref="gml:AbstractTimeObject"/>
			</choice>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="rangeSet" type="gml:RangeSetType">
		<annotation>
			<documentation>The gml:rangeSet property element contains the values of the coverage (sometimes called the attribute values).  Its content model is given by gml:RangeSetType.
This content model supports a structural description of the range.  The semantic information describing the range set is embedded using a uniform method, as part of the explicit values, or as a template value accompanying the representation using gml:DataBlock and gml:File.
The values from each component (or "band") in the range may be encoded within a gml:ValueArray element or a concrete member of the gml:AbstractScalarValueList substitution group . Use of these elements satisfies the value-type homogeneity requirement.</documentation>
		</annotation>
	</element>
	<complexType name="RangeSetType">
		<choice>
			<element ref="gml:ValueArray" maxOccurs="unbounded"/>
			<element ref="gml:AbstractScalarValueList" maxOccurs="unbounded"/>
			<element ref="gml:DataBlock"/>
			<element ref="gml:File"/>
		</choice>
	</complexType>
	<element name="DataBlock" type="gml:DataBlockType" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>gml:DataBlock describes the Range as a block of text encoded values similar to a Common Separated Value (CSV) representation.
The range set parameterization is described by the property gml:rangeParameters.</documentation>
		</annotation>
	</element>
	<complexType name="DataBlockType">
		<sequence>
			<element ref="gml:rangeParameters"/>
			<choice>
				<element ref="gml:tupleList"/>
				<element ref="gml:doubleOrNilReasonTupleList"/>
			</choice>
		</sequence>
	</complexType>
	<element name="rangeParameters" type="gml:AssociationRoleType"/>
	<element name="tupleList" type="gml:CoordinatesType">
		<annotation>
			<documentation>gml:CoordinatesType consists of a list of coordinate tuples, with each coordinate tuple separated by the ts or tuple separator (whitespace), and each coordinate in the tuple by the cs or coordinate separator (comma).
The gml:tupleList encoding is effectively "band-interleaved".</documentation>
		</annotation>
	</element>
	<element name="doubleOrNilReasonTupleList" type="gml:doubleOrNilReasonList">
		<annotation>
			<documentation>gml:doubleOrNilReasonList consists of a list of gml:doubleOrNilReason values, each separated by a whitespace. The gml:doubleOrNilReason values are grouped into tuples where the dimension of each tuple in the list is equal to the number of range parameters.</documentation>
		</annotation>
	</element>
	<element name="File" type="gml:FileType" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>for efficiency reasons, GML also provides a means of encoding the range set in an arbitrary external encoding, such as a binary file.  This encoding may be "well-known" but this is not required. This mode uses the gml:File element.
The values of the coverage (attribute values in the range set) are transmitted in a external file that is referenced from the XML structure described by gml:FileType.  The external file is referenced by the gml:fileReference property that is an anyURI (the gml:fileName property has been deprecated).  This means that the external file may be located remotely from the referencing GML instance. 
The gml:compression property points to a definition of a compression algorithm through an anyURI.  This may be a retrievable, computable definition or simply a reference to an unambiguous name for the compression method.
The gml:mimeType property points to a definition of the file mime type.
The gml:fileStructure property is defined by a codelist. Note further that all values shall be enclosed in a single file. Multi-file structures for values are not supported in GML.
The semantics of the range set is described as above using the gml:rangeParameters property.
Note that if any compression algorithm is applied, the structure above applies only to the pre-compression or post-decompression structure of the file.
Note that the fields within a record match the gml:valueComponents of the gml:CompositeValue in document order.</documentation>
		</annotation>
	</element>
	<complexType name="FileType">
		<sequence>
			<element ref="gml:rangeParameters"/>
			<choice>
				<element name="fileName" type="anyURI">
					<annotation>
						<appinfo>deprecated</appinfo>
					</annotation>
				</element>
				<element name="fileReference" type="anyURI"/>
			</choice>
			<element name="fileStructure" type="gml:CodeType"/>
			<element name="mimeType" type="anyURI" minOccurs="0"/>
			<element name="compression" type="anyURI" minOccurs="0"/>
		</sequence>
	</complexType>
	<element name="coverageFunction" type="gml:CoverageFunctionType" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>The gml:coverageFunction property describes the mapping function from the domain to the range of the coverage.
The value of the CoverageFunction is one of gml:CoverageMappingRule and gml:GridFunction.
If the gml:coverageFunction property is omitted for a gridded coverage (including rectified gridded coverages) the gml:startPoint is assumed to be the value of the gml:low property in the gml:Grid geometry, and the gml:sequenceRule is assumed to be linear and the gml:axisOrder property is assumed to be "+1 +2".</documentation>
		</annotation>
	</element>
	<complexType name="CoverageFunctionType">
		<choice>
			<element ref="gml:MappingRule"/>
			<element ref="gml:CoverageMappingRule"/>
			<element ref="gml:GridFunction"/>
		</choice>
	</complexType>
	<element name="CoverageMappingRule" type="gml:MappingRuleType" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>gml:CoverageMappingRule provides a formal or informal description of the coverage function.
The mapping rule may be defined as an in-line string (gml:ruleDefinition) or via a remote reference through xlink:href (gml:ruleReference).  
If no rule name is specified, the default is 'Linear' with respect to members of the domain in document order.</documentation>
		</annotation>
	</element>
	<complexType name="MappingRuleType" final="#all">
		<choice>
			<element name="ruleDefinition" type="string"/>
			<element name="ruleReference" type="gml:ReferenceType"/>
		</choice>
	</complexType>
	<element name="GridFunction" type="gml:GridFunctionType" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>gml:GridFunction provides an explicit mapping rule for grid geometries, i.e. the domain shall be a geometry of type grid.  It describes the mapping of grid posts (discrete point grid coverage) or grid cells (discrete surface coverage) to the values in the range set.
The gml:startPoint is the index position of a point in the grid that is mapped to the first point in the range set (this is also the index position of the first grid post).  If the gml:startPoint property is omitted the gml:startPoint is assumed to be equal to the value of gml:low in the gml:Grid geometry. Subsequent points in the mapping are determined by the value of the gml:sequenceRule.</documentation>
		</annotation>
	</element>
	<complexType name="GridFunctionType">
		<sequence>
			<element name="sequenceRule" type="gml:SequenceRuleType" minOccurs="0"/>
			<element name="startPoint" type="gml:integerList" minOccurs="0"/>
		</sequence>
	</complexType>
	<complexType name="SequenceRuleType">
		<annotation>
			<documentation>The gml:SequenceRuleType is derived from the gml:SequenceRuleEnumeration through the addition of an axisOrder attribute.  The gml:SequenceRuleEnumeration is an enumerated type. The rule names are defined in ISO 19123. If no rule name is specified the default is "Linear".</documentation>
		</annotation>
		<simpleContent>
			<extension base="gml:SequenceRuleEnumeration">
				<attribute name="order" type="gml:IncrementOrder">
					<annotation>
						<appinfo>deprecated</appinfo>
					</annotation>
				</attribute>
				<attribute name="axisOrder" type="gml:AxisDirectionList"/>
			</extension>
		</simpleContent>
	</complexType>
	<simpleType name="SequenceRuleEnumeration">
		<restriction base="string">
			<enumeration value="Linear"/>
			<enumeration value="Boustrophedonic"/>
			<enumeration value="Cantor-diagonal"/>
			<enumeration value="Spiral"/>
			<enumeration value="Morton"/>
			<enumeration value="Hilbert"/>
		</restriction>
	</simpleType>
	<simpleType name="AxisDirectionList">
		<annotation>
			<documentation>The different values in a gml:AxisDirectionList indicate the incrementation order to be used on all axes of the grid. Each axis shall be mentioned once and only once.</documentation>
		</annotation>
		<list itemType="gml:AxisDirection"/>
	</simpleType>
	<simpleType name="AxisDirection">
		<annotation>
			<documentation>The value of a gml:AxisDirection indicates the incrementation order to be used on an axis of the grid.</documentation>
		</annotation>
		<restriction base="string">
			<pattern value="[\+\-][1-9][0-9]*"/>
		</restriction>
	</simpleType>
	<element name="MultiPointCoverage" type="gml:DiscreteCoverageType" substitutionGroup="gml:AbstractDiscreteCoverage">
		<annotation>
			<documentation>In a gml:MultiPointCoverage the domain set is a gml:MultiPoint, that is a collection of arbitrarily distributed geometric points.
The content model is identical with gml:DiscreteCoverageType, but that gml:domainSet shall have values gml:MultiPoint.
In a gml:MultiPointCoverage the mapping from the domain to the range is straightforward.
-	For gml:DataBlock encodings the points of the gml:MultiPoint are mapped in document order to the tuples of the data block.
-	For gml:CompositeValue encodings the points of the gml:MultiPoint are mapped to the members of the composite value in document order.
-	For gml:File encodings the points of the gml:MultiPoint are mapped to the records of the file in sequential order.
</documentation>
		</annotation>
	</element>
	<element name="MultiCurveCoverage" type="gml:DiscreteCoverageType" substitutionGroup="gml:AbstractDiscreteCoverage">
		<annotation>
			<documentation>In a gml:MultiCurveCoverage the domain is partioned into a collection of curves comprising a gml:MultiCurve.  The coverage function then maps each curve in the collection to a value in the range set.
The content model is identical with gml:DiscreteCoverageType, but that gml:domainSet shall have values gml:MultiCurve.
In a gml:MultiCurveCoverage the mapping from the domain to the range is straightforward.
-	For gml:DataBlock encodings the curves of the gml:MultiCurve are mapped in document order to the tuples of the data block.
-	For gml:CompositeValue encodings the curves of the gml:MultiCurve are mapped to the members of the composite value in document order.
-	For gml:File encodings the curves of the gml:MultiCurve are mapped to the records of the file in sequential order.
</documentation>
		</annotation>
	</element>
	<element name="MultiSurfaceCoverage" type="gml:DiscreteCoverageType" substitutionGroup="gml:AbstractDiscreteCoverage">
		<annotation>
			<documentation>In a gml:MultiSurfaceCoverage the domain is partioned into a collection of surfaces comprising a gml:MultiSurface.  The coverage function than maps each surface in the collection to a value in the range set.
The content model is identical with gml:DiscreteCoverageType, but that gml:domainSet shall have values gml:MultiSurface.
In a gml:MultiSurfaceCoverage the mapping from the domain to the range is straightforward.
-	For gml:DataBlock encodings the surfaces of the gml:MultiSurface are mapped in document order to the tuples of the data block.
-	For gml:CompositeValue encodings the surfaces of the gml:MultiSurface are mapped to the members of the composite value in document order.
-	For gml:File encodings the surfaces of the gml:MultiSurface are mapped to the records of the file in sequential order.
</documentation>
		</annotation>
	</element>
	<element name="MultiSolidCoverage" type="gml:DiscreteCoverageType" substitutionGroup="gml:AbstractDiscreteCoverage">
		<annotation>
			<documentation>In a gml:MultiSolidCoverage the domain is partioned into a collection of solids comprising a gml:MultiSolid.  The coverage function than maps each solid in the collection to a value in the range set.
The content model is identical with gml:DiscreteCoverageType, but that gml:domainSet shall have values gml:MultiSolid.
In a gml:MultiSolidCoverage the mapping from the domain to the range is straightforward.
-	For gml:DataBlock encodings the solids of the gml:MultiSolid are mapped in document order to the tuples of the data block.
-	For gml:CompositeValue encodings the solids of the gml:MultiSolid are mapped to the members of the composite value in document order.
-	For gml:File encodings the solids of the gml:MultiSolid are mapped to the records of the file in sequential order.
</documentation>
		</annotation>
	</element>
	<element name="GridCoverage" type="gml:DiscreteCoverageType" substitutionGroup="gml:AbstractDiscreteCoverage">
		<annotation>
			<documentation>A gml:GriddedCoverage is a discrete point coverage in which the domain set is a geometric grid of points.
Note that this is the same as the gml:MultiPointCoverage except that we have a gml:Grid to describe the domain.
The simple gridded coverage is not geometrically referenced and hence no geometric positions are assignable to the points in the grid. Such geometric positioning is introduced in the gml:RectifiedGridCoverage.</documentation>
		</annotation>
	</element>
	<element name="RectifiedGridCoverage" type="gml:DiscreteCoverageType" substitutionGroup="gml:AbstractDiscreteCoverage">
		<annotation>
			<documentation>The gml:RectifiedGridCoverage is a discrete point coverage based on a rectified grid. It is similar to the grid coverage except that the points of the grid are geometrically referenced. The rectified grid coverage has a domain that is a gml:RectifiedGrid geometry.</documentation>
		</annotation>
	</element>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/coordinateReferenceSystems.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" xml:lang="en" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:coordinateReferenceSystems:3.2.2">coordinateReferenceSystems.xsd</appinfo>
		<documentation>See ISO/DIS 19136 13.3.
The spatial-temporal coordinate reference systems schema components are divided into two logical parts. One part defines elements and types for XML encoding of abstract coordinate reference systems definitions. The larger part defines specialized constructs for XML encoding of definitions of the multiple concrete types of spatial-temporal coordinate reference systems.
These schema components encode the Coordinate Reference System packages of the UML Models of ISO 19111 Clause 8 and ISO/DIS 19136 D.3.10, with the exception of the abstract "SC_CRS" class.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="coordinateSystems.xsd"/>
	<include schemaLocation="datums.xsd"/>
	<include schemaLocation="coordinateOperations.xsd"/>
	<element name="AbstractSingleCRS" type="gml:AbstractCRSType" abstract="true" substitutionGroup="gml:AbstractCRS">
		<annotation>
			<documentation>gml:AbstractSingleCRS implements a coordinate reference system consisting of one coordinate system and one datum (as opposed to a Compound CRS).</documentation>
		</annotation>
	</element>
	<complexType name="SingleCRSPropertyType">
		<annotation>
			<documentation>gml:SingleCRSPropertyType is a property type for association roles to a single coordinate reference system, either referencing or containing the definition of that coordinate reference system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractSingleCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="AbstractGeneralDerivedCRS" type="gml:AbstractGeneralDerivedCRSType" abstract="true" substitutionGroup="gml:AbstractSingleCRS">
		<annotation>
			<documentation>gml:AbstractGeneralDerivedCRS is a coordinate reference system that is defined by its coordinate conversion from another coordinate reference system. This abstract complex type shall not be used, extended, or restricted, in a GML Application Schema, to define a concrete subtype with a meaning equivalent to a concrete subtype specified in this document.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractGeneralDerivedCRSType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractCRSType">
				<sequence>
					<element ref="gml:conversion"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="conversion" type="gml:GeneralConversionPropertyType">
		<annotation>
			<documentation>gml:conversion is an association role to the coordinate conversion used to define the derived CRS.</documentation>
		</annotation>
	</element>
	<element name="CompoundCRS" type="gml:CompoundCRSType" substitutionGroup="gml:AbstractCRS">
		<annotation>
			<documentation>gml:CompundCRS is a coordinate reference system describing the position of points through two or more independent coordinate reference systems. It is associated with a non-repeating sequence of two or more instances of SingleCRS.</documentation>
		</annotation>
	</element>
	<complexType name="CompoundCRSType">
		<complexContent>
			<extension base="gml:AbstractCRSType">
				<sequence>
					<element ref="gml:componentReferenceSystem" minOccurs="2" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="componentReferenceSystem" type="gml:SingleCRSPropertyType">
		<annotation>
			<documentation>The gml:componentReferenceSystem elements are an ordered sequence of associations to all the component coordinate reference systems included in this compound coordinate reference system. The gml:AggregationAttributeGroup should be used to specify that the gml:componentReferenceSystem properties are ordered.</documentation>
		</annotation>
	</element>
	<complexType name="CompoundCRSPropertyType">
		<annotation>
			<documentation>gml:CompoundCRSPropertyType is a property type for association roles to a compound coordinate reference system, either referencing or containing the definition of that reference system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:CompoundCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="GeodeticCRS" type="gml:GeodeticCRSType" substitutionGroup="gml:AbstractSingleCRS"/>
	<complexType name="GeodeticCRSType">
		<annotation>
			<documentation>gml:GeodeticCRS is a coordinate reference system based on a geodetic datum.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractCRSType">
				<sequence>
					<choice>
						<element ref="gml:ellipsoidalCS"/>
						<element ref="gml:cartesianCS"/>
						<element ref="gml:sphericalCS"/>
					</choice>
					<element ref="gml:geodeticDatum"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="ellipsoidalCS" type="gml:EllipsoidalCSPropertyType">
		<annotation>
			<documentation>gml:ellipsoidalCS is an association role to the ellipsoidal coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="cartesianCS" type="gml:CartesianCSPropertyType">
		<annotation>
			<documentation>gml:cartesianCS is an association role to the Cartesian coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="sphericalCS" type="gml:SphericalCSPropertyType">
		<annotation>
			<documentation>gml:sphericalCS is an association role to the spherical coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="geodeticDatum" type="gml:GeodeticDatumPropertyType">
		<annotation>
			<documentation>gml:geodeticDatum is an association role to the geodetic datum used by this CRS.
</documentation>
		</annotation>
	</element>
	<complexType name="GeodeticCRSPropertyType">
		<annotation>
			<documentation>gml:GeodeticCRSPropertyType is a property type for association roles to a geodetic coordinate reference system, either referencing or containing the definition of that reference system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:GeodeticCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="VerticalCRS" type="gml:VerticalCRSType" substitutionGroup="gml:AbstractSingleCRS">
		<annotation>
			<documentation>gml:VerticalCRS is a 1D coordinate reference system used for recording heights or depths. Vertical CRSs make use of the direction of gravity to define the concept of height or depth, but the relationship with gravity may not be straightforward. By implication, ellipsoidal heights (h) cannot be captured in a vertical coordinate reference system. Ellipsoidal heights cannot exist independently, but only as an inseparable part of a 3D coordinate tuple defined in a geographic 3D coordinate reference system.</documentation>
		</annotation>
	</element>
	<complexType name="VerticalCRSType">
		<complexContent>
			<extension base="gml:AbstractCRSType">
				<sequence>
					<element ref="gml:verticalCS"/>
					<element ref="gml:verticalDatum"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="verticalCS" type="gml:VerticalCSPropertyType">
		<annotation>
			<documentation>gml:verticalCS is an association role to the vertical coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="verticalDatum" type="gml:VerticalDatumPropertyType">
		<annotation>
			<documentation>gml:verticalDatum is an association role to the vertical datum used by this CRS.</documentation>
		</annotation>
	</element>
	<complexType name="VerticalCRSPropertyType">
		<annotation>
			<documentation>gml:VerticalCRSPropertyType is a property type for association roles to a vertical coordinate reference system, either referencing or containing the definition of that reference system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:VerticalCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="ProjectedCRS" type="gml:ProjectedCRSType" substitutionGroup="gml:AbstractGeneralDerivedCRS">
		<annotation>
			<documentation>gml:ProjectedCRS is a 2D coordinate reference system used to approximate the shape of the earth on a planar surface, but in such a way that the distortion that is inherent to the approximation is carefully controlled and known. Distortion correction is commonly applied to calculated bearings and distances to produce values that are a close match to actual field values.</documentation>
		</annotation>
	</element>
	<complexType name="ProjectedCRSType">
		<complexContent>
			<extension base="gml:AbstractGeneralDerivedCRSType">
				<sequence>
					<choice>
						<element ref="gml:baseGeodeticCRS"/>
						<element ref="gml:baseGeographicCRS"/>
					</choice>
					<element ref="gml:cartesianCS"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="baseGeodeticCRS" type="gml:GeodeticCRSPropertyType">
		<annotation>
			<documentation>gml:baseGeodeticCRS is an association role to the geodetic coordinate reference system used by this projected CRS.</documentation>
		</annotation>
	</element>
	<complexType name="ProjectedCRSPropertyType">
		<annotation>
			<documentation>gml:ProjectedCRSPropertyType is a property type for association roles to a projected coordinate reference system, either referencing or containing the definition of that reference system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:ProjectedCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="DerivedCRS" type="gml:DerivedCRSType" substitutionGroup="gml:AbstractGeneralDerivedCRS">
		<annotation>
			<documentation>gml:DerivedCRS is a single coordinate reference system that is defined by its coordinate conversion from another single coordinate reference system known as the base CRS. The base CRS can be a projected coordinate reference system, if this DerivedCRS is used for a georectified grid coverage as described in ISO 19123, Clause 8.</documentation>
		</annotation>
	</element>
	<complexType name="DerivedCRSType">
		<complexContent>
			<extension base="gml:AbstractGeneralDerivedCRSType">
				<sequence>
					<element ref="gml:baseCRS"/>
					<element ref="gml:derivedCRSType"/>
					<element ref="gml:coordinateSystem"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="baseCRS" type="gml:SingleCRSPropertyType">
		<annotation>
			<documentation>gml:baseCRS is an association role to the coordinate reference system used by this derived CRS.</documentation>
		</annotation>
	</element>
	<element name="derivedCRSType" type="gml:CodeWithAuthorityType">
		<annotation>
			<documentation>The gml:derivedCRSType property describes the type of a derived coordinate reference system. The required codeSpace attribute shall reference a source of information specifying the values and meanings of all the allowed string values for this property.</documentation>
		</annotation>
	</element>
	<element name="coordinateSystem" type="gml:CoordinateSystemPropertyType">
		<annotation>
			<documentation>An association role to the coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<complexType name="DerivedCRSPropertyType">
		<annotation>
			<documentation>gml:DerivedCRSPropertyType is a property type for association roles to a non-projected derived coordinate reference system, either referencing or containing the definition of that reference system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:DerivedCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="EngineeringCRS" type="gml:EngineeringCRSType" substitutionGroup="gml:AbstractSingleCRS">
		<annotation>
			<documentation>gml:EngineeringCRS is a contextually local coordinate reference system which can be divided into two broad categories:
-	earth-fixed systems applied to engineering activities on or near the surface of the earth;
-	CRSs on moving platforms such as road vehicles, vessels, aircraft, or spacecraft, see ISO 19111 8.3.</documentation>
		</annotation>
	</element>
	<complexType name="EngineeringCRSType">
		<complexContent>
			<extension base="gml:AbstractCRSType">
				<sequence>
					<choice>
						<element ref="gml:affineCS"/>
						<element ref="gml:cartesianCS"/>
						<element ref="gml:cylindricalCS"/>
						<element ref="gml:linearCS"/>
						<element ref="gml:polarCS"/>
						<element ref="gml:sphericalCS"/>
						<element ref="gml:userDefinedCS"/>
						<element ref="gml:coordinateSystem">
							<annotation>
								<appinfo>deprecated</appinfo>
							</annotation>
						</element>
					</choice>
					<element ref="gml:engineeringDatum"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="cylindricalCS" type="gml:CylindricalCSPropertyType">
		<annotation>
			<documentation>gml:cylindricalCS is an association role to the cylindrical coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="linearCS" type="gml:LinearCSPropertyType">
		<annotation>
			<documentation>gml:linearCS is an association role to the linear coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="polarCS" type="gml:PolarCSPropertyType">
		<annotation>
			<documentation>gml:polarCS is an association role to the polar coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="userDefinedCS" type="gml:UserDefinedCSPropertyType">
		<annotation>
			<documentation>gml:userDefinedCS is an association role to the user defined coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="engineeringDatum" type="gml:EngineeringDatumPropertyType">
		<annotation>
			<documentation>gml:engineeringDatum is an association role to the engineering datum used by this CRS.</documentation>
		</annotation>
	</element>
	<complexType name="EngineeringCRSPropertyType">
		<annotation>
			<documentation>gml:EngineeringCRSPropertyType is a property type for association roles to an engineering coordinate reference system, either referencing or containing the definition of that reference system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:EngineeringCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="ImageCRS" type="gml:ImageCRSType" substitutionGroup="gml:AbstractSingleCRS">
		<annotation>
			<documentation>gml:ImageCRS is an engineering coordinate reference system applied to locations in images. Image coordinate reference systems are treated as a separate sub-type because the definition of the associated image datum contains two attributes not relevant to other engineering datums.</documentation>
		</annotation>
	</element>
	<complexType name="ImageCRSType">
		<complexContent>
			<extension base="gml:AbstractCRSType">
				<sequence>
					<choice>
						<element ref="gml:cartesianCS"/>
						<element ref="gml:affineCS"/>
						<element ref="gml:usesObliqueCartesianCS"/>
					</choice>
					<element ref="gml:imageDatum"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="affineCS" type="gml:AffineCSPropertyType">
		<annotation>
			<documentation>gml:affineCS is an association role to the affine coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="imageDatum" type="gml:ImageDatumPropertyType">
		<annotation>
			<documentation>gml:imageDatum is an association role to the image datum used by this CRS.</documentation>
		</annotation>
	</element>
	<complexType name="ImageCRSPropertyType">
		<annotation>
			<documentation>gml:ImageCRSPropertyType is a property type for association roles to an image coordinate reference system, either referencing or containing the definition of that reference system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:ImageCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="TemporalCRS" type="gml:TemporalCRSType" substitutionGroup="gml:AbstractSingleCRS">
		<annotation>
			<documentation>gml:TemporalCRS is a 1D coordinate reference system used for the recording of time.</documentation>
		</annotation>
	</element>
	<complexType name="TemporalCRSType">
		<complexContent>
			<extension base="gml:AbstractCRSType">
				<sequence>
					<choice>
						<element ref="gml:timeCS"/>
						<element ref="gml:usesTemporalCS"/>
					</choice>
					<element ref="gml:temporalDatum"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="timeCS" type="gml:TimeCSPropertyType">
		<annotation>
			<documentation>gml:timeCS is an association role to the time coordinate system used by this CRS.</documentation>
		</annotation>
	</element>
	<element name="temporalDatum" type="gml:TemporalDatumPropertyType">
		<annotation>
			<documentation>gml:temporalDatum is an association role to the temporal datum used by this CRS.</documentation>
		</annotation>
	</element>
	<complexType name="TemporalCRSPropertyType">
		<annotation>
			<documentation>gml:TemporalCRSPropertyType is a property type for association roles to a temporal coordinate reference system, either referencing or containing the definition of that reference system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TemporalCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/observation.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:observation:3.2.2">observation.xsd</appinfo>
		<documentation>See ISO/DIS 19136 Clause 19.
A GML observation models the act of observing, often with a camera, a person or some form of instrument.  An observation feature describes the "metadata" associated with an information capture event, together with a value for the result of the observation.  This covers a broad range of cases, from a tourist photo (not the photo but the act of taking the photo), to images acquired by space borne sensors or the measurement of a temperature 5 meters below the surfaces of a lake.
The basic structures introduced in this schema are intended to serve as the foundation for more comprehensive schemas for scientific, technical and engineering measurement schemas.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="feature.xsd"/>
	<include schemaLocation="direction.xsd"/>
	<include schemaLocation="valueObjects.xsd"/>
	<element name="Observation" type="gml:ObservationType" substitutionGroup="gml:AbstractFeature">
		<annotation>
			<documentation>The content model is a straightforward extension of gml:AbstractFeatureType; it automatically has the gml:identifier, gml:description, gml:descriptionReference, gml:name, and gml:boundedBy properties. 
The gml:validTime element describes the time of the observation. Note that this may be a time instant or a time period.
The gml:using property contains or references a description of a sensor, instrument or procedure used for the observation.
The gml:target property contains or references the specimen, region or station which is the object of the observation. This property is particularly useful for remote observations, such as photographs, where a generic location property might apply to the location of the camera or the location of the field of view, and thus may be ambiguous.  
The gml:subject element is provided as a convenient synonym for gml:target. This is the term commonly used in phtotography.  
The gml:resultOf property indicates the result of the observation.  The value may be inline, or a reference to a value elsewhere.
</documentation>
		</annotation>
	</element>
	<complexType name="ObservationType">
		<complexContent>
			<extension base="gml:AbstractFeatureType">
				<sequence>
					<element ref="gml:validTime"/>
					<element ref="gml:using" minOccurs="0"/>
					<element ref="gml:target" minOccurs="0"/>
					<element ref="gml:resultOf"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="using" type="gml:ProcedurePropertyType"/>
	<complexType name="ProcedurePropertyType">
		<sequence minOccurs="0">
			<element ref="gml:AbstractFeature"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="target" type="gml:TargetPropertyType"/>
	<element name="subject" type="gml:TargetPropertyType" substitutionGroup="gml:target"/>
	<complexType name="TargetPropertyType">
		<choice minOccurs="0">
			<element ref="gml:AbstractFeature"/>
			<element ref="gml:AbstractGeometry"/>
		</choice>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="resultOf" type="gml:ResultType"/>
	<complexType name="ResultType">
		<sequence minOccurs="0">
			<any namespace="##any"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="DirectedObservation" type="gml:DirectedObservationType" substitutionGroup="gml:Observation">
		<annotation>
			<documentation>A gml:DirectedObservation is the same as an observation except that it adds an additional gml:direction property. This is the direction in which the observation was acquired. Clearly this applies only to certain types of observations such as visual observations by people, or observations obtained from terrestrial cameras.</documentation>
		</annotation>
	</element>
	<complexType name="DirectedObservationType">
		<complexContent>
			<extension base="gml:ObservationType">
				<sequence>
					<element ref="gml:direction"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="DirectedObservationAtDistance" type="gml:DirectedObservationAtDistanceType" substitutionGroup="gml:DirectedObservation">
		<annotation>
			<documentation>gml:DirectedObservationAtDistance adds an additional distance property. This is the distance from the observer to the subject of the observation. Clearly this applies only to certain types of observations such as visual observations by people, or observations obtained from terrestrial cameras.</documentation>
		</annotation>
	</element>
	<complexType name="DirectedObservationAtDistanceType">
		<complexContent>
			<extension base="gml:DirectedObservationType">
				<sequence>
					<element name="distance" type="gml:MeasureType"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/temporalReferenceSystems.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:temporalReferenceSystems:3.2.2">temporalReferenceSystems.xsd</appinfo>
		<documentation>See ISO/DIS 19136 15.5.
A value in the time domain is measured relative to a temporal reference system. Common types of reference systems include calendars, ordinal temporal reference systems, and temporal coordinate systems (time elapsed since some epoch).  The primary temporal reference system for use with geographic information is the Gregorian Calendar and 24 hour local or Coordinated Universal Time (UTC), but special applications may entail the use of alternative reference systems.  The Julian day numbering system is a temporal coordinate system that has an origin earlier than any known calendar, at noon on 1 January 4713 BC in the Julian proleptic calendar, and is useful in transformations between dates in different calendars.    
In GML seven concrete elements are used to describe temporal reference systems: gml:TimeReferenceSystem, gml:TimeCoordinateSystem, gml:TimeCalendar, gml:TimeCalendarEra, gml:TimeClock, gml:TimeOrdinalReferenceSystem, and gml:TimeOrdinalEra.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="temporalTopology.xsd"/>
	<include schemaLocation="dictionary.xsd"/>
	<element name="TimeReferenceSystem" type="gml:TimeReferenceSystemType" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>A reference system is characterized in terms of its domain of validity: the spatial and temporal extent over which it is applicable. The basic GML element for temporal reference systems is gml:TimeReferenceSystem.  Its content model extends gml:DefinitionType with one additional property, gml:domainOfValidity.</documentation>
		</annotation>
	</element>
	<complexType name="TimeReferenceSystemType">
		<complexContent>
			<extension base="gml:DefinitionType">
				<sequence>
					<element name="domainOfValidity" type="string"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="TimeCoordinateSystem" type="gml:TimeCoordinateSystemType" substitutionGroup="gml:TimeReferenceSystem">
		<annotation>
			<documentation>A temporal coordinate system shall be based on a continuous interval scale defined in terms of a single time interval.
The differences to ISO 19108 TM_CoordinateSystem are:
-	the origin is specified either using the property gml:originPosition whose value is a direct time position, or using the property gml:origin whose model is gml:TimeInstantPropertyType; this permits more flexibility in representation and also supports referring to a value fixed elsewhere;
-	the interval uses gml:TimeIntervalLengthType.
</documentation>
		</annotation>
	</element>
	<complexType name="TimeCoordinateSystemType">
		<complexContent>
			<extension base="gml:TimeReferenceSystemType">
				<sequence>
					<choice>
						<element name="originPosition" type="gml:TimePositionType"/>
						<element name="origin" type="gml:TimeInstantPropertyType"/>
					</choice>
					<element name="interval" type="gml:TimeIntervalLengthType"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="TimeCalendar" type="gml:TimeCalendarType" substitutionGroup="gml:TimeReferenceSystem">
		<annotation>
			<documentation>A calendar is a discrete temporal reference system that provides a basis for defining temporal position to a resolution of one day.
gml:TimeCalendar adds one property to those inherited from gml:TimeReferenceSystem. A gml:referenceFrame provides a link to a gml:TimeCalendarEra that it uses. A  gml:TimeCalendar may reference more than one calendar era. 
The referenceFrame element follows the standard GML property model, allowing the association to be instantiated either using an inline description using the gml:TimeCalendarEra element, or a link to a gml:TimeCalendarEra which is explicit elsewhere.</documentation>
		</annotation>
	</element>
	<complexType name="TimeCalendarType">
		<complexContent>
			<extension base="gml:TimeReferenceSystemType">
				<sequence>
					<element name="referenceFrame" type="gml:TimeCalendarEraPropertyType" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="TimeCalendarEra" type="gml:TimeCalendarEraType">
		<annotation>
			<documentation>gml:TimeCalendarEra inherits basic properties from gml:DefinitionType and has the following additional properties:
-	gml:referenceEvent is the name or description of a mythical or historic event which fixes the position of the base scale of the calendar era.  This is given as text or using a link to description held elsewhere.
-	gml:referenceDate specifies the date of the referenceEvent expressed as a date in the given calendar.  In most calendars, this date is the origin (i.e., the first day) of the scale, but this is not always true.
-	gml:julianReference specifies the Julian date that corresponds to the reference date.  The Julian day number is an integer value; the Julian date is a decimal value that allows greater resolution.  Transforming calendar dates to and from Julian dates provides a relatively simple basis for transforming dates from one calendar to another.
-	gml:epochOfUse is the period for which the calendar era was used as a basis for dating.</documentation>
		</annotation>
	</element>
	<complexType name="TimeCalendarEraType">
		<complexContent>
			<extension base="gml:DefinitionType">
				<sequence>
					<element name="referenceEvent" type="gml:StringOrRefType"/>
					<element name="referenceDate" type="gml:CalDate"/>
					<element name="julianReference" type="decimal"/>
					<element name="epochOfUse" type="gml:TimePeriodPropertyType"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimeCalendarPropertyType">
		<annotation>
			<documentation>gml:TimeCalendarPropertyType provides for associating a gml:TimeCalendar with an object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimeCalendar"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<complexType name="TimeCalendarEraPropertyType">
		<annotation>
			<documentation>gml:TimeCalendarEraPropertyType provides for associating a gml:TimeCalendarEra with an object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimeCalendarEra"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="TimeClock" type="gml:TimeClockType" substitutionGroup="gml:TimeReferenceSystem">
		<annotation>
			<documentation>A clock provides a basis for defining temporal position within a day. A clock shall be used with a calendar in order to provide a complete description of a temporal position within a specific day.
gml:TimeClock adds the following properties to those inherited from gml:TimeReferenceSystemType:
-	gml:referenceEvent is the name or description of an event, such as solar noon or sunrise, which fixes the position of the base scale of the clock.
-	gml:referenceTime specifies the time of day associated with the reference event expressed as a time of day in the given clock. The reference time is usually the origin of the clock scale. 
-	gml:utcReference specifies the 24 hour local or UTC time that corresponds to the reference time.
-	gml:dateBasis contains or references the calendars that use this clock.</documentation>
		</annotation>
	</element>
	<complexType name="TimeClockType" final="#all">
		<complexContent>
			<extension base="gml:TimeReferenceSystemType">
				<sequence>
					<element name="referenceEvent" type="gml:StringOrRefType"/>
					<element name="referenceTime" type="time"/>
					<element name="utcReference" type="time"/>
					<element name="dateBasis" type="gml:TimeCalendarPropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimeClockPropertyType">
		<annotation>
			<documentation>gml:TimeClockPropertyType provides for associating a gml:TimeClock with an object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimeClock"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="TimeOrdinalReferenceSystem" type="gml:TimeOrdinalReferenceSystemType" substitutionGroup="gml:TimeReferenceSystem">
		<annotation>
			<documentation>In some applications of geographic information — such as geology and archaeology — relative position in time is known more precisely than absolute time or duration. The order of events in time can be well established, but the magnitude of the intervals between them cannot be accurately determined; in such cases, the use of an ordinal temporal reference system is appropriate. An ordinal temporal reference system is composed of a sequence of named coterminous eras, which may in turn be composed of sequences of member eras at a finer scale, giving the whole a hierarchical structure of eras of verying resolution. 
An ordinal temporal reference system whose component eras are not further subdivided is effectively a temporal topological complex constrained to be a linear graph. An ordinal temporal reference system some or all of whose component eras are subdivided is effectively a temporal topological complex with the constraint that parallel branches may only be constructed in pairs where one is a single temporal ordinal era and the other is a sequence of temporal ordinal eras that are called "members" of the "group". This constraint means that within a single temporal ordinal reference system, the relative position of all temporal ordinal eras is unambiguous.  
The positions of the beginning and end of a given era may calibrate the relative time scale.
gml:TimeOrdinalReferenceSystem adds one or more gml:component properties to the generic temporal reference system model.</documentation>
		</annotation>
	</element>
	<complexType name="TimeOrdinalReferenceSystemType">
		<complexContent>
			<extension base="gml:TimeReferenceSystemType">
				<sequence>
					<element name="component" type="gml:TimeOrdinalEraPropertyType" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="TimeOrdinalEra" type="gml:TimeOrdinalEraType">
		<annotation>
			<documentation>Its content model follows the pattern of gml:TimeEdge, inheriting standard properties from gml:DefinitionType, and adding gml:start, gml:end and gml:extent properties, a set of gml:member properties which indicate ordered gml:TimeOrdinalEra elements, and a gml:group property which points to the parent era.
The recursive inclusion of gml:TimeOrdinalEra elements allow the construction of an arbitrary depth hierarchical ordinal reference schema, such that an ordinal era at a given level of the hierarchy includes a sequence of shorter, coterminous ordinal eras.</documentation>
		</annotation>
	</element>
	<complexType name="TimeOrdinalEraType">
		<complexContent>
			<extension base="gml:DefinitionType">
				<sequence>
					<element name="relatedTime" type="gml:RelatedTimeType" minOccurs="0" maxOccurs="unbounded"/>
					<element name="start" type="gml:TimeNodePropertyType" minOccurs="0"/>
					<element name="end" type="gml:TimeNodePropertyType" minOccurs="0"/>
					<element name="extent" type="gml:TimePeriodPropertyType" minOccurs="0"/>
					<element name="member" type="gml:TimeOrdinalEraPropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<element name="group" type="gml:ReferenceType" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimeOrdinalEraPropertyType">
		<annotation>
			<documentation>gml:TimeOrdinalEraPropertyType provides for associating a gml:TimeOrdinalEra with an object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimeOrdinalEra"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/deprecatedTypes.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:deprecatedTypes:3.2.2">deprecatedTypes.xsd</appinfo>
		<documentation>All global schema components that are part of the GML schema, but were deprecated. See Annex I.
			
			GML is an OGC Standard.
			Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
			To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<element name="Null" type="gml:NilReasonType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="anchorPoint" type="gml:CodeType" substitutionGroup="gml:anchorDefinition">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="datumRef" type="gml:DatumPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesPrimeMeridian" type="gml:PrimeMeridianPropertyType" substitutionGroup="gml:primeMeridian">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesEllipsoid" type="gml:EllipsoidPropertyType" substitutionGroup="gml:ellipsoid">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="geodeticDatumRef" type="gml:GeodeticDatumPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="ellipsoidRef" type="gml:EllipsoidPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="primeMeridianRef" type="gml:PrimeMeridianPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="engineeringDatumRef" type="gml:EngineeringDatumPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="imageDatumRef" type="gml:ImageDatumPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="verticalDatumRef" type="gml:VerticalDatumPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="temporalDatumRef" type="gml:TemporalDatumPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="coordinateOperationRef" type="gml:CoordinateOperationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="singleOperationRef" type="gml:SingleOperationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="AbstractOperation" type="gml:AbstractCoordinateOperationType" abstract="true" substitutionGroup="gml:AbstractSingleOperation">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="OperationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractOperation"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="operationRef" type="gml:OperationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="generalConversionRef" type="gml:GeneralConversionPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="generalTransformationRef" type="gml:GeneralTransformationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesSingleOperation" type="gml:CoordinateOperationPropertyType" substitutionGroup="gml:coordOperation">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="concatenatedOperationRef" type="gml:ConcatenatedOperationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesOperation" type="gml:CoordinateOperationPropertyType" substitutionGroup="gml:coordOperation">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="passThroughOperationRef" type="gml:PassThroughOperationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesMethod" type="gml:OperationMethodPropertyType" substitutionGroup="gml:method">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesValue" type="gml:AbstractGeneralParameterValuePropertyType" substitutionGroup="gml:parameterValue">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="conversionRef" type="gml:ConversionPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="transformationRef" type="gml:TransformationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="dmsAngleValue" type="gml:DMSAngleType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="valueOfParameter" type="gml:OperationParameterPropertyType" substitutionGroup="gml:operationParameter">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="includesValue" type="gml:AbstractGeneralParameterValuePropertyType" substitutionGroup="gml:parameterValue">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="valuesOfGroup" type="gml:OperationParameterGroupPropertyType" substitutionGroup="gml:group">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="methodFormula" type="gml:CodeType" substitutionGroup="gml:formula">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesParameter" type="gml:AbstractGeneralOperationParameterPropertyType" substitutionGroup="gml:generalOperationParameter">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="operationMethodRef" type="gml:OperationMethodPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="abstractGeneralOperationParameterRef" type="gml:AbstractGeneralOperationParameterPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="operationParameterRef" type="gml:OperationParameterPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="includesParameter" type="gml:AbstractGeneralOperationParameterPropertyType" substitutionGroup="gml:parameter">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="operationParameterGroupRef" type="gml:OperationParameterPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="referenceSystemRef" type="gml:CRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="crsRef" type="gml:CRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="coordinateSystemAxisRef" type="gml:CoordinateSystemAxisPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesAxis" type="gml:CoordinateSystemAxisPropertyType" substitutionGroup="gml:axis">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="coordinateSystemRef" type="gml:CoordinateSystemPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="ellipsoidalCSRef" type="gml:EllipsoidalCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="cartesianCSRef" type="gml:CartesianCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="verticalCSRef" type="gml:VerticalCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="TemporalCS" type="gml:TemporalCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="TemporalCSType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="TemporalCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TemporalCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="temporalCSRef" type="gml:TemporalCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="linearCSRef" type="gml:LinearCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="userDefinedCSRef" type="gml:UserDefinedCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="sphericalCSRef" type="gml:SphericalCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="polarCSRef" type="gml:PolarCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="cylindricalCSRef" type="gml:CylindricalCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="ObliqueCartesianCS" type="gml:ObliqueCartesianCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="ObliqueCartesianCSType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="ObliqueCartesianCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:ObliqueCartesianCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="obliqueCartesianCSRef" type="gml:ObliqueCartesianCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="singleCRSRef" type="gml:SingleCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="definedByConversion" type="gml:GeneralConversionPropertyType" substitutionGroup="gml:conversion">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="includesSingleCRS" type="gml:SingleCRSPropertyType" substitutionGroup="gml:componentReferenceSystem">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="compoundCRSRef" type="gml:CompoundCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesEllipsoidalCS" type="gml:EllipsoidalCSPropertyType" substitutionGroup="gml:ellipsoidalCS">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesCartesianCS" type="gml:CartesianCSPropertyType" substitutionGroup="gml:cartesianCS">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesSphericalCS" type="gml:SphericalCSPropertyType" substitutionGroup="gml:sphericalCS">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesGeodeticDatum" type="gml:GeodeticDatumPropertyType" substitutionGroup="gml:geodeticDatum">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesVerticalCS" type="gml:VerticalCSPropertyType" substitutionGroup="gml:verticalCS">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesVerticalDatum" type="gml:VerticalDatumPropertyType" substitutionGroup="gml:verticalDatum">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="verticalCRSRef" type="gml:VerticalCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="baseGeographicCRS" type="gml:GeographicCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="projectedCRSRef" type="gml:ProjectedCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesCS" type="gml:CoordinateSystemPropertyType" substitutionGroup="gml:coordinateSystem">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="derivedCRSRef" type="gml:DerivedCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesEngineeringDatum" type="gml:EngineeringDatumPropertyType" substitutionGroup="gml:engineeringDatum">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="engineeringCRSRef" type="gml:EngineeringCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesAffineCS" type="gml:AffineCSPropertyType" substitutionGroup="gml:affineCS">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesImageDatum" type="gml:ImageDatumPropertyType" substitutionGroup="gml:imageDatum">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesObliqueCartesianCS" type="gml:ObliqueCartesianCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="imageCRSRef" type="gml:ImageCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesTimeCS" type="gml:TimeCSPropertyType" substitutionGroup="gml:timeCS">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesTemporalCS" type="gml:TemporalCSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="usesTemporalDatum" type="gml:TemporalDatumPropertyType" substitutionGroup="gml:temporalDatum">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="temporalCRSRef" type="gml:TemporalCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="GeographicCRS" type="gml:GeographicCRSType" substitutionGroup="gml:AbstractSingleCRS">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="GeographicCRSType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractCRSType">
				<sequence>
					<element ref="gml:usesEllipsoidalCS"/>
					<element ref="gml:usesGeodeticDatum"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="GeographicCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:GeographicCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="geographicCRSRef" type="gml:GeographicCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="GeocentricCRS" type="gml:GeocentricCRSType" substitutionGroup="gml:AbstractSingleCRS">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="GeocentricCRSType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractCRSType">
				<sequence>
					<choice>
						<element ref="gml:usesCartesianCS"/>
						<element ref="gml:usesSphericalCS"/>
					</choice>
					<element ref="gml:usesGeodeticDatum"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="GeocentricCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:GeocentricCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="geocentricCRSRef" type="gml:GeocentricCRSPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<attribute name="uom" type="anyURI">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</attribute>
	<simpleType name="SuccessionType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<restriction base="string">
			<enumeration value="substitution"/>
			<enumeration value="division"/>
			<enumeration value="fusion"/>
			<enumeration value="initiation"/>
		</restriction>
	</simpleType>
	<element name="dmsAngle" type="gml:DMSAngleType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="DMSAngleType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence>
			<element ref="gml:degrees"/>
			<choice minOccurs="0">
				<element ref="gml:decimalMinutes"/>
				<sequence>
					<element ref="gml:minutes"/>
					<element ref="gml:seconds" minOccurs="0"/>
				</sequence>
			</choice>
		</sequence>
	</complexType>
	<element name="degrees" type="gml:DegreesType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="DegreesType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<simpleContent>
			<extension base="gml:DegreeValueType">
				<attribute name="direction">
					<simpleType>
						<restriction base="string">
							<enumeration value="N"/>
							<enumeration value="E"/>
							<enumeration value="S"/>
							<enumeration value="W"/>
							<enumeration value="+"/>
							<enumeration value="-"/>
						</restriction>
					</simpleType>
				</attribute>
			</extension>
		</simpleContent>
	</complexType>
	<simpleType name="DegreeValueType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<restriction base="nonNegativeInteger">
			<maxInclusive value="359"/>
		</restriction>
	</simpleType>
	<element name="decimalMinutes" type="gml:DecimalMinutesType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<simpleType name="DecimalMinutesType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<restriction base="decimal">
			<minInclusive value="0.00"/>
			<maxExclusive value="60.00"/>
		</restriction>
	</simpleType>
	<element name="minutes" type="gml:ArcMinutesType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<simpleType name="ArcMinutesType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<restriction base="nonNegativeInteger">
			<maxInclusive value="59"/>
		</restriction>
	</simpleType>
	<element name="seconds" type="gml:ArcSecondsType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<simpleType name="ArcSecondsType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<restriction base="decimal">
			<minInclusive value="0.00"/>
			<maxExclusive value="60.00"/>
		</restriction>
	</simpleType>
	<complexType name="AngleChoiceType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<choice>
			<element ref="gml:angle"/>
			<element ref="gml:dmsAngle"/>
		</choice>
	</complexType>
	<attribute name="remoteSchema" type="anyURI">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</attribute>
	<element name="member" type="gml:AssociationRoleType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="ArrayAssociationType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence>
			<element ref="gml:AbstractObject" minOccurs="0" maxOccurs="unbounded"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="members" type="gml:ArrayAssociationType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="StringOrRefType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<simpleContent>
			<extension base="string">
				<attributeGroup ref="gml:AssociationAttributeGroup"/>
			</extension>
		</simpleContent>
	</complexType>
	<element name="metaDataProperty" type="gml:MetaDataPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="Bag" type="gml:BagType" substitutionGroup="gml:AbstractGML">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="BagType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractGMLType">
				<sequence>
					<element ref="gml:member" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:members" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="Array" type="gml:ArrayType" substitutionGroup="gml:AbstractGML">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="ArrayType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractGMLType">
				<sequence>
					<element ref="gml:members" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="MetaDataPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractMetaData"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attribute name="about" type="anyURI"/>
	</complexType>
	<element name="AbstractMetaData" type="gml:AbstractMetaDataType" abstract="true" substitutionGroup="gml:AbstractObject">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="AbstractMetaDataType" abstract="true" mixed="true">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence/>
		<attribute ref="gml:id"/>
	</complexType>
	<element name="GenericMetaData" type="gml:GenericMetaDataType" substitutionGroup="gml:AbstractMetaData">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="GenericMetaDataType" mixed="true">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent mixed="true">
			<extension base="gml:AbstractMetaDataType">
				<sequence>
					<any processContents="lax" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="coordinates" type="gml:CoordinatesType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="pointRep" type="gml:PointPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="location" type="gml:LocationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="LocationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence>
			<choice>
				<element ref="gml:AbstractGeometry"/>
				<element ref="gml:LocationKeyWord"/>
				<element ref="gml:LocationString"/>
				<element ref="gml:Null"/>
			</choice>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="LocationString" type="gml:StringOrRefType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="LocationKeyWord" type="gml:CodeType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="priorityLocation" type="gml:PriorityLocationPropertyType" substitutionGroup="gml:location">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="PriorityLocationPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:LocationPropertyType">
				<attribute name="priority" type="string"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="featureMember" type="gml:FeaturePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="featureProperty" type="gml:FeaturePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="FeatureArrayPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence minOccurs="0" maxOccurs="unbounded">
			<element ref="gml:AbstractFeature"/>
		</sequence>
	</complexType>
	<element name="featureMembers" type="gml:FeatureArrayPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="BoundedFeatureType" abstract="true">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<restriction base="gml:AbstractFeatureType">
				<sequence>
					<group ref="gml:StandardObjectProperties"/>
					<element ref="gml:boundedBy"/>
					<element ref="gml:location" minOccurs="0"/>
				</sequence>
			</restriction>
		</complexContent>
	</complexType>
	<complexType name="AbstractFeatureCollectionType" abstract="true">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractFeatureType">
				<sequence>
					<element ref="gml:featureMember" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:featureMembers" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractFeatureCollection" type="gml:AbstractFeatureCollectionType" abstract="true" substitutionGroup="gml:AbstractFeature">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="FeatureCollection" type="gml:FeatureCollectionType" substitutionGroup="gml:AbstractFeature">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="FeatureCollectionType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractFeatureCollectionType"/>
		</complexContent>
	</complexType>
	<element name="track" type="gml:HistoryPropertyType" substitutionGroup="gml:history">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="DefinitionCollection" type="gml:DictionaryType" substitutionGroup="gml:Definition">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="definitionMember" type="gml:DictionaryEntryType" substitutionGroup="gml:dictionaryEntry">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="indirectEntry" type="gml:IndirectEntryType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="IndirectEntryType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<sequence>
			<element ref="gml:DefinitionProxy"/>
		</sequence>
	</complexType>
	<element name="DefinitionProxy" type="gml:DefinitionProxyType" substitutionGroup="gml:Definition">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="DefinitionProxyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:DefinitionType">
				<sequence>
					<element ref="gml:definitionRef"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="definitionRef" type="gml:ReferenceType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="MappingRule" type="gml:StringOrRefType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<simpleType name="IncrementOrder">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<restriction base="string">
			<enumeration value="+x+y"/>
			<enumeration value="+y+x"/>
			<enumeration value="+x-y"/>
			<enumeration value="-x-y"/>
		</restriction>
	</simpleType>
	<element name="centerOf" type="gml:PointPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="position" type="gml:PointPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="extentOf" type="gml:SurfacePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="edgeOf" type="gml:CurvePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="centerLineOf" type="gml:CurvePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiLocation" type="gml:MultiPointPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiCenterOf" type="gml:MultiPointPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiPosition" type="gml:MultiPointPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiCenterLineOf" type="gml:MultiCurvePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiEdgeOf" type="gml:MultiCurvePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiCoverage" type="gml:MultiSurfacePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiExtentOf" type="gml:MultiSurfacePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="polygonPatches" type="gml:SurfacePatchArrayPropertyType" substitutionGroup="gml:patches">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="trianglePatches" type="gml:SurfacePatchArrayPropertyType" substitutionGroup="gml:patches">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiPointDomain" type="gml:DomainSetType" substitutionGroup="gml:domainSet">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiCurveDomain" type="gml:DomainSetType" substitutionGroup="gml:domainSet">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiSurfaceDomain" type="gml:DomainSetType" substitutionGroup="gml:domainSet">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiSolidDomain" type="gml:DomainSetType" substitutionGroup="gml:domainSet">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="gridDomain" type="gml:DomainSetType" substitutionGroup="gml:domainSet">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="rectifiedGridDomain" type="gml:DomainSetType" substitutionGroup="gml:domainSet">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="generalOperationParameter" type="gml:AbstractGeneralOperationParameterPropertyType" substitutionGroup="gml:parameter">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="MovingObjectStatus" type="gml:MovingObjectStatusType" substitutionGroup="gml:AbstractTimeSlice">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<complexType name="MovingObjectStatusType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractTimeSliceType">
				<sequence>
					<choice>
						<element name="position" type="gml:GeometryPropertyType"/>
						<element ref="gml:pos"/>
						<element ref="gml:locationName"/>
						<element ref="gml:locationReference"/>
						<element ref="gml:location"/>
					</choice>
					<element name="speed" type="gml:MeasureType" minOccurs="0"/>
					<element name="bearing" type="gml:DirectionPropertyType" minOccurs="0"/>
					<element name="acceleration" type="gml:MeasureType" minOccurs="0"/>
					<element name="elevation" type="gml:MeasureType" minOccurs="0"/>
					<element ref="gml:status" minOccurs="0"/>
					<element ref="gml:statusReference" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="status" type="gml:StringOrRefType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="statusReference" type="gml:ReferenceType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
  <element name="topoComplexProperty" type="gml:TopoComplexPropertyType">
    <annotation>
			<appinfo>deprecated</appinfo>
    </annotation>
  </element>
	<element name="multiPointProperty" type="gml:MultiPointPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiCurveProperty" type="gml:MultiCurvePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiSurfaceProperty" type="gml:MultiSurfacePropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiSolidProperty" type="gml:MultiSolidPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="multiGeometryProperty" type="gml:MultiGeometryPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="pointArrayProperty" type="gml:PointArrayPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="curveArrayProperty" type="gml:CurveArrayPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="surfaceArrayProperty" type="gml:SurfaceArrayPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
	<element name="solidArrayProperty" type="gml:SolidArrayPropertyType">
		<annotation>
			<appinfo>deprecated</appinfo>
		</annotation>
	</element>
</schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" targetNamespace="http://www.isotc211.org/2005/gco" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic COmmon (GCO) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GCO includes all the definitions of http://www.isotc211.org/2005/gco namespace. The root document of this namespace is the file gco.xsd.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:include schemaLocation="basicTypes.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/metadataEntity.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This metadataEntity.xsd schema implements the UML conceptual schema defined in A.2.1 of ISO 19115:2003. It contains the implementation of the class MD_Metadata.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="spatialRepresentation.xsd"/>
	<xs:include schemaLocation="metadataExtension.xsd"/>
	<xs:include schemaLocation="content.xsd"/>
	<xs:include schemaLocation="metadataApplication.xsd"/>
	<xs:include schemaLocation="applicationSchema.xsd"/>
	<xs:include schemaLocation="portrayalCatalogue.xsd"/>
	<xs:include schemaLocation="dataQuality.xsd"/>
	<xs:include schemaLocation="freeText.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="MD_Metadata_Type">
		<xs:annotation>
			<xs:documentation>Information about the metadata</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="fileIdentifier" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="language" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="characterSet" type="gmd:MD_CharacterSetCode_PropertyType" minOccurs="0"/>
					<xs:element name="parentIdentifier" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="hierarchyLevel" type="gmd:MD_ScopeCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="hierarchyLevelName" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="contact" type="gmd:CI_ResponsibleParty_PropertyType" maxOccurs="unbounded"/>
					<xs:element name="dateStamp" type="gco:Date_PropertyType"/>
					<xs:element name="metadataStandardName" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="metadataStandardVersion" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="dataSetURI" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="locale" type="gmd:PT_Locale_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="spatialRepresentationInfo" type="gmd:MD_SpatialRepresentation_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="referenceSystemInfo" type="gmd:MD_ReferenceSystem_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="metadataExtensionInfo" type="gmd:MD_MetadataExtensionInformation_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="identificationInfo" type="gmd:MD_Identification_PropertyType" maxOccurs="unbounded"/>
					<xs:element name="contentInfo" type="gmd:MD_ContentInformation_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="distributionInfo" type="gmd:MD_Distribution_PropertyType" minOccurs="0"/>
					<xs:element name="dataQualityInfo" type="gmd:DQ_DataQuality_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="portrayalCatalogueInfo" type="gmd:MD_PortrayalCatalogueReference_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="metadataConstraints" type="gmd:MD_Constraints_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="applicationSchemaInfo" type="gmd:MD_ApplicationSchemaInformation_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="metadataMaintenance" type="gmd:MD_MaintenanceInformation_PropertyType" minOccurs="0"/>
					<xs:element name="series" type="gmd:DS_Aggregate_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="describes" type="gmd:DS_DataSet_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="propertyType" type="gco:ObjectReference_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="featureType" type="gco:ObjectReference_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="featureAttribute" type="gco:ObjectReference_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Metadata" type="gmd:MD_Metadata_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Metadata_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Metadata"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/gml/3.2.1/feature.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:feature:3.2.2">feature.xsd</appinfo>
		<documentation>See ISO/DIS 19136 Clause 9.
A GML feature is a (representation of a) identifiable real-world object in a selected domain of discourse. The feature schema provides a framework for the creation of GML features and feature collections.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="geometryAggregates.xsd"/>
	<include schemaLocation="temporal.xsd"/>
	<complexType name="AbstractFeatureType" abstract="true">
		<annotation>
			<documentation>The basic feature model is given by the gml:AbstractFeatureType.
The content model for gml:AbstractFeatureType adds two specific properties suitable for geographic features to the content model defined in gml:AbstractGMLType. 
The value of the gml:boundedBy property describes an envelope that encloses the entire feature instance, and is primarily useful for supporting rapid searching for features that occur in a particular location. 
The value of the gml:location property describes the extent, position or relative location of the feature.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractGMLType">
				<sequence>
					<element ref="gml:boundedBy" minOccurs="0"/>
					<element ref="gml:location" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractFeature" type="gml:AbstractFeatureType" abstract="true" substitutionGroup="gml:AbstractGML">
		<annotation>
			<documentation>This abstract element serves as the head of a substitution group which may contain any elements whose content model is derived from gml:AbstractFeatureType.  This may be used as a variable in the construction of content models.  
gml:AbstractFeature may be thought of as "anything that is a GML feature" and may be used to define variables or templates in which the value of a GML property is "any feature". This occurs in particular in a GML feature collection where the feature member properties contain one or multiple copies of gml:AbstractFeature respectively.</documentation>
		</annotation>
	</element>
	<complexType name="FeaturePropertyType">
		<sequence minOccurs="0">
			<element ref="gml:AbstractFeature"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="boundedBy" type="gml:BoundingShapeType" nillable="true">
		<annotation>
			<documentation>This property describes the minimum bounding box or rectangle that encloses the entire feature.</documentation>
		</annotation>
	</element>
	<complexType name="BoundingShapeType">
		<sequence>
			<choice>
				<element ref="gml:Envelope"/>
				<element ref="gml:Null"/>
			</choice>
		</sequence>
		<attribute name="nilReason" type="gml:NilReasonType"/>
	</complexType>
	<element name="EnvelopeWithTimePeriod" type="gml:EnvelopeWithTimePeriodType" substitutionGroup="gml:Envelope">
		<annotation>
			<documentation>gml:EnvelopeWithTimePeriod is provided for envelopes that include a temporal extent. It adds two time position properties, gml:beginPosition and gml:endPosition, which describe the extent of a time-envelope.  
Since gml:EnvelopeWithTimePeriod is assigned to the substitution group headed by gml:Envelope, it may be used whenever gml:Envelope is valid.</documentation>
		</annotation>
	</element>
	<complexType name="EnvelopeWithTimePeriodType">
		<complexContent>
			<extension base="gml:EnvelopeType">
				<sequence>
					<element name="beginPosition" type="gml:TimePositionType"/>
					<element name="endPosition" type="gml:TimePositionType"/>
				</sequence>
				<attribute name="frame" type="anyURI" default="#ISO-8601"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="locationName" type="gml:CodeType">
		<annotation>
			<documentation>The gml:locationName property element is a convenience property where the text value describes the location of the feature. If the location names are selected from a controlled list, then the list shall be identified in the codeSpace attribute.</documentation>
		</annotation>
	</element>
	<element name="locationReference" type="gml:ReferenceType">
		<annotation>
			<documentation>The gml:locationReference property element is a convenience property where the text value referenced by the xlink:href attribute describes the location of the feature.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractFeatureMemberType" abstract="true">
		<annotation>
			<documentation>To create a collection of GML features, a property type shall be derived by extension from gml:AbstractFeatureMemberType.
By default, this abstract property type does not imply any ownership of the features in the collection. The owns attribute of gml:OwnershipAttributeGroup may be used on a property element instance to assert ownership of a feature in the collection. A collection shall not own a feature already owned by another object.</documentation>
		</annotation>
		<sequence/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/direction.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" attributeFormDefault="unqualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:direction:3.2.2">direction.xsd</appinfo>
		<documentation>See ISO/DIS 19136 Clause 18.
The direction schema components provide the GML Application Schema developer with a standard property element to describe direction, and associated objects that may be used to express orientation, direction, heading, bearing or other directional aspects of geographic features.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="geometryBasic0d1d.xsd"/>
	<element name="direction" type="gml:DirectionPropertyType">
		<annotation>
			<documentation>The property gml:direction is intended as a pre-defined property expressing a direction to be assigned to features defined in a GML application schema.</documentation>
		</annotation>
	</element>
	<complexType name="DirectionPropertyType">
		<choice minOccurs="0">
			<element name="DirectionVector" type="gml:DirectionVectorType"/>
			<element name="DirectionDescription" type="gml:DirectionDescriptionType"/>
			<element name="CompassPoint" type="gml:CompassPointEnumeration"/>
			<element name="DirectionKeyword" type="gml:CodeType"/>
			<element name="DirectionString" type="gml:StringOrRefType"/>
		</choice>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<complexType name="DirectionVectorType">
		<annotation>
			<documentation>Direction vectors are specified by providing components of a vector.</documentation>
		</annotation>
		<choice>
			<element ref="gml:vector"/>
			<sequence>
				<annotation>
					<appinfo>deprecated</appinfo>
				</annotation>
				<element name="horizontalAngle" type="gml:AngleType"/>
				<element name="verticalAngle" type="gml:AngleType"/>
			</sequence>
		</choice>
	</complexType>
	<complexType name="DirectionDescriptionType">
		<annotation>
			<documentation>direction descriptions are specified by a compass point code, a keyword, a textual description or a reference to a description.
A gml:compassPoint is specified by a simple enumeration.  	
In addition, thre elements to contain text-based descriptions of direction are provided.  
If the direction is specified using a term from a list, gml:keyword should be used, and the list indicated using the value of the codeSpace attribute. 
if the direction is decribed in prose, gml:direction or gml:reference should be used, allowing the value to be included inline or by reference.</documentation>
		</annotation>
		<choice>
			<element name="compassPoint" type="gml:CompassPointEnumeration"/>
			<element name="keyword" type="gml:CodeType"/>
			<element name="description" type="string"/>
			<element name="reference" type="gml:ReferenceType"/>
		</choice>
	</complexType>
	<simpleType name="CompassPointEnumeration">
		<annotation>
			<documentation>These directions are necessarily approximate, giving direction with a precision of 22.5°. It is thus generally unnecessary to specify the reference frame, though this may be detailed in the definition of a GML application language.</documentation>
		</annotation>
		<restriction base="string">
			<enumeration value="N"/>
			<enumeration value="NNE"/>
			<enumeration value="NE"/>
			<enumeration value="ENE"/>
			<enumeration value="E"/>
			<enumeration value="ESE"/>
			<enumeration value="SE"/>
			<enumeration value="SSE"/>
			<enumeration value="S"/>
			<enumeration value="SSW"/>
			<enumeration value="SW"/>
			<enumeration value="WSW"/>
			<enumeration value="W"/>
			<enumeration value="WNW"/>
			<enumeration value="NW"/>
			<enumeration value="NNW"/>
		</restriction>
	</simpleType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/geometryComplexes.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:geometryComplexes:3.2.2">geometryComplexes.xsd</appinfo>
		<documentation>See ISO/DIS 19136 12.2.
Geometric complexes (i.e. instances of gml:GeometricComplexType) are closed collections of geometric primitives, i.e. they will contain their boundaries. 
A geometric complex (gml:GeometricComplex) is defined by ISO 19107:2003, 6.6.1 as "a set of primitive geometric objects (in a common coordinate system) whose interiors are disjoint. Further, if a primitive is in a geometric complex, then there exists a set of primitives in that complex whose point-wise union is the boundary of this first primitive."
A geometric composite (gml:CompositeCurve, gml:CompositeSurface and gml:CompositeSolid) represents a geometric complex with an underlying core geometry that is isomorphic to a primitive, i.e. it can be viewed as a primitive and as a complex. See ISO 19107:2003, 6.1 and 6.6.3 for more details on the nature of composite geometries.
Geometric complexes and composites are intended to be used in application schemas where the sharing of geometry is important.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="geometryAggregates.xsd"/>
	<complexType name="GeometricComplexType">
		<complexContent>
			<extension base="gml:AbstractGeometryType">
				<sequence>
					<element name="element" type="gml:GeometricPrimitivePropertyType" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="GeometricComplex" type="gml:GeometricComplexType" substitutionGroup="gml:AbstractGeometry"/>
	<complexType name="GeometricComplexPropertyType">
		<annotation>
			<documentation>A property that has a geometric complex as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<choice>
				<element ref="gml:GeometricComplex"/>
				<element ref="gml:CompositeCurve"/>
				<element ref="gml:CompositeSurface"/>
				<element ref="gml:CompositeSolid"/>
			</choice>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<complexType name="CompositeCurveType">
		<complexContent>
			<extension base="gml:AbstractCurveType">
				<sequence>
					<element ref="gml:curveMember" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="CompositeCurve" type="gml:CompositeCurveType" substitutionGroup="gml:AbstractCurve">
		<annotation>
			<documentation>A gml:CompositeCurve is represented by a sequence of (orientable) curves such that each curve in the sequence terminates at the start point of the subsequent curve in the list. 
curveMember references or contains inline one curve in the composite curve. 
The curves are contiguous, the collection of curves is ordered. Therefore, if provided, the aggregationType attribute shall have the value "sequence".</documentation>
		</annotation>
	</element>
	<complexType name="CompositeSurfaceType">
		<complexContent>
			<extension base="gml:AbstractSurfaceType">
				<sequence>
					<element ref="gml:surfaceMember" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="CompositeSurface" type="gml:CompositeSurfaceType" substitutionGroup="gml:AbstractSurface">
		<annotation>
			<documentation>A gml:CompositeSurface is represented by a set of orientable surfaces. It is geometry type with all the geometric properties of a (primitive) surface. Essentially, a composite surface is a collection of surfaces that join in pairs on common boundary curves and which, when considered as a whole, form a single surface.
surfaceMember references or contains inline one surface in the composite surface. 
The surfaces are contiguous.</documentation>
		</annotation>
	</element>
	<complexType name="CompositeSolidType">
		<complexContent>
			<extension base="gml:AbstractSolidType">
				<sequence>
					<element ref="gml:solidMember" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="CompositeSolid" type="gml:CompositeSolidType" substitutionGroup="gml:AbstractSolid">
		<annotation>
			<documentation>gml:CompositeSolid implements ISO 19107 GM_CompositeSolid (see ISO 19107:2003, 6.6.7) as specified in D.2.3.6. 
A gml:CompositeSolid is represented by a set of orientable surfaces. It is a geometry type with all the geometric properties of a (primitive) solid. Essentially, a composite solid is a collection of solids that join in pairs on common boundary surfaces and which, when considered as a whole, form a single solid. 
solidMember references or contains one solid in the composite solid. The solids are contiguous.</documentation>
		</annotation>
	</element>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/valueObjects.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:valueObjects:3.2.2">valueObjects.xsd</appinfo>
		<documentation>See ISO/DIS 19136 17.5.
The elements declared in this Clause build on other GML schema components, in particular gml:AbstractTimeObject, gml:AbstractGeometry, and the following types:  gml:MeasureType, gml:MeasureListType, gml:CodeType, gml:CodeOrNilReasonListType, gml:BooleanOrNilReasonListType, gml:IntegerOrNilReasonList.  
Of particular interest are elements that are the heads of substitution groups, and one named choice group. These are the primary reasons for the value objects schema, since they may act as variables in the definition of content models, such as Observations, when it is desired to permit alternative value types to occur some of which may have complex content such as arrays, geometry and time objects, and where it is useful not to prescribe the actual value type in advance. The members of the groups include quantities, category classifications, boolean, count, temporal and spatial values, and aggregates of these.  
The value objects are defined in a hierarchy. The following relationships are defined:
-	Concrete elements gml:Quantity, gml:Category, gml:Count and gml:Boolean are substitutable for the abstract element gml:AbstractScalarValue.  
-	Concrete elements gml:QuantityList, gml:CategoryList, gml:CountList and gml:BooleanList are substitutable for the abstract element gml:AbstractScalarValueList.  
-	Concrete element gml:ValueArray is substitutable for the concrete element gml:CompositeValue.  
-	Abstract elements gml:AbstractScalarValue and gml:AbstractScalarValueList, and concrete elements gml:CompositeValue, gml:ValueExtent, gml:CategoryExtent, gml:CountExtent and gml:QuantityExtent are substitutable for abstract element gml:AbstractValue.  
-	Abstract elements gml:AbstractValue, gml:AbstractTimeObject and gml:AbstractGeometry are all in a choice group named gml:Value, which is used for compositing in gml:CompositeValue and gml:ValueExtent.  
-	Schemas which need values may use the abstract element gml:AbstractValue in a content model in order to permit any of the gml:AbstractScalarValues, gml:AbstractScalarValueLists, gml:CompositeValue or gml:ValueExtent to occur in an instance, or the named group gml:Value to also permit gml:AbstractTimeObjects, gml:AbstractGeometrys.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="geometryBasic0d1d.xsd"/>
	<include schemaLocation="temporal.xsd"/>
	<element name="Boolean" substitutionGroup="gml:AbstractScalarValue" nillable="true">
		<complexType>
			<simpleContent>
				<extension base="boolean">
					<attribute name="nilReason" type="gml:NilReasonType"/>
				</extension>
			</simpleContent>
		</complexType>
	</element>
	<element name="BooleanList" type="gml:booleanOrNilReasonList" substitutionGroup="gml:AbstractScalarValueList"/>
	<element name="Category" substitutionGroup="gml:AbstractScalarValue" nillable="true">
		<annotation>
			<documentation>A gml:Category has an optional XML attribute codeSpace, whose value is a URI which identifies a dictionary, codelist or authority for the term.</documentation>
		</annotation>
		<complexType>
			<simpleContent>
				<extension base="gml:CodeType">
					<attribute name="nilReason" type="gml:NilReasonType"/>
				</extension>
			</simpleContent>
		</complexType>
	</element>
	<element name="CategoryList" type="gml:CodeOrNilReasonListType" substitutionGroup="gml:AbstractScalarValueList"/>
	<element name="Count" substitutionGroup="gml:AbstractScalarValue" nillable="true">
		<complexType>
			<simpleContent>
				<extension base="integer">
					<attribute name="nilReason" type="gml:NilReasonType"/>
				</extension>
			</simpleContent>
		</complexType>
	</element>
	<element name="CountList" type="gml:integerOrNilReasonList" substitutionGroup="gml:AbstractScalarValueList"/>
	<element name="Quantity" substitutionGroup="gml:AbstractScalarValue" nillable="true">
		<annotation>
			<documentation>An XML attribute uom ("unit of measure") is required, whose value is a URI which identifies the definition of a ratio scale or units by which the numeric value shall be multiplied, or an interval or position scale on which the value occurs.</documentation>
		</annotation>
		<complexType>
			<simpleContent>
				<extension base="gml:MeasureType">
					<attribute name="nilReason" type="gml:NilReasonType"/>
				</extension>
			</simpleContent>
		</complexType>
	</element>
	<element name="QuantityList" type="gml:MeasureOrNilReasonListType" substitutionGroup="gml:AbstractScalarValueList"/>
	<element name="AbstractValue" type="anyType" abstract="true" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>gml:AbstractValue is an abstract element which acts as the head of a substitution group which contains gml:AbstractScalarValue, gml:AbstractScalarValueList, gml:CompositeValue and gml:ValueExtent, and (transitively) the elements in their substitution groups.
These elements may be used in an application schema as variables, so that in an XML instance document any member of its substitution group may occur.</documentation>
		</annotation>
	</element>
	<element name="AbstractScalarValue" type="anyType" abstract="true" substitutionGroup="gml:AbstractValue">
		<annotation>
			<documentation>gml:AbstractScalarValue is an abstract element which acts as the head of a substitution group which contains gml:Boolean, gml:Category, gml:Count and gml:Quantity, and (transitively) the elements in their substitution groups.</documentation>
		</annotation>
	</element>
	<element name="AbstractScalarValueList" type="anyType" abstract="true" substitutionGroup="gml:AbstractValue">
		<annotation>
			<documentation>gml:AbstractScalarValueList is an abstract element which acts as the head of a substitution group which contains gml:BooleanList, gml:CategoryList, gml:CountList and gml:QuantityList, and (transitively) the elements in their substitution groups.</documentation>
		</annotation>
	</element>
	<group name="Value">
		<annotation>
			<documentation>This is a convenience choice group which unifies generic values defined in this Clause with spatial and temporal objects and the measures described above, so that any of these may be used within aggregate values.</documentation>
		</annotation>
		<choice>
			<element ref="gml:AbstractValue"/>
			<element ref="gml:AbstractGeometry"/>
			<element ref="gml:AbstractTimeObject"/>
			<element ref="gml:Null"/>
		</choice>
	</group>
	<element name="valueProperty" type="gml:ValuePropertyType">
		<annotation>
			<documentation>Property that refers to, or contains, a Value. Convenience element for general use.</documentation>
		</annotation>
	</element>
	<element name="valueComponent" type="gml:ValuePropertyType">
		<annotation>
			<documentation>Property that refers to, or contains, a Value.</documentation>
		</annotation>
	</element>
	<complexType name="ValuePropertyType">
		<sequence minOccurs="0">
			<group ref="gml:Value"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="valueComponents" type="gml:ValueArrayPropertyType">
		<annotation>
			<documentation>Property that contains Values.</documentation>
		</annotation>
	</element>
	<complexType name="ValueArrayPropertyType">
		<sequence maxOccurs="unbounded">
			<group ref="gml:Value"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="CompositeValue" type="gml:CompositeValueType" substitutionGroup="gml:AbstractValue">
		<annotation>
			<documentation>gml:CompositeValue is an aggregate value built from other values . It contains zero or an arbitrary number of gml:valueComponent elements, and zero or one gml:valueComponents property elements.  It may be used for strongly coupled aggregates (vectors, tensors) or for arbitrary collections of values.</documentation>
		</annotation>
	</element>
	<complexType name="CompositeValueType">
		<complexContent>
			<extension base="gml:AbstractGMLType">
				<sequence>
					<element ref="gml:valueComponent" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:valueComponents" minOccurs="0"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="ValueArray" type="gml:ValueArrayType" substitutionGroup="gml:CompositeValue">
		<annotation>
			<documentation>A Value Array is used for homogeneous arrays of primitive and aggregate values.  
The member values may be scalars, composites, arrays or lists.
ValueArray has the same content model as CompositeValue, but the member values shall be homogeneous.  The element declaration contains a Schematron constraint which expresses this restriction precisely.  Since the members are homogeneous, the gml:referenceSystem (uom, codeSpace) may be specified on the gml:ValueArray itself and inherited by all the members if desired.</documentation>
		</annotation>
	</element>
	<complexType name="ValueArrayType">
		<complexContent>
			<extension base="gml:CompositeValueType">
				<attributeGroup ref="gml:referenceSystem"/>
			</extension>
		</complexContent>
	</complexType>
	<attributeGroup name="referenceSystem">
		<attribute name="codeSpace" type="anyURI"/>
		<attribute name="uom" type="gml:UomIdentifier"/>
	</attributeGroup>
	<element name="CategoryExtent" type="gml:CategoryExtentType" substitutionGroup="gml:AbstractValue"/>
	<complexType name="CategoryExtentType">
		<simpleContent>
			<restriction base="gml:CodeOrNilReasonListType">
				<length value="2"/>
			</restriction>
		</simpleContent>
	</complexType>
	<element name="CountExtent" type="gml:CountExtentType" substitutionGroup="gml:AbstractValue"/>
	<simpleType name="CountExtentType">
		<restriction base="gml:integerOrNilReasonList">
			<length value="2"/>
		</restriction>
	</simpleType>
	<element name="QuantityExtent" type="gml:QuantityExtentType" substitutionGroup="gml:AbstractValue"/>
	<complexType name="QuantityExtentType">
		<simpleContent>
			<restriction base="gml:MeasureOrNilReasonListType">
				<length value="2"/>
			</restriction>
		</simpleContent>
	</complexType>
	<complexType name="BooleanPropertyType">
		<sequence minOccurs="0">
			<element ref="gml:Boolean"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<complexType name="CategoryPropertyType">
		<sequence minOccurs="0">
			<element ref="gml:Category"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<complexType name="QuantityPropertyType">
		<sequence minOccurs="0">
			<element ref="gml:Quantity"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<complexType name="CountPropertyType">
		<sequence minOccurs="0">
			<element ref="gml:Count"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/grids.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:grids:3.2.2">grids.xsd</appinfo>
		<documentation>See ISO/DIS 19136 20.2.
An implicit description of geometry is one in which the items of the geometry do not explicitly appear in the encoding.  Instead, a compact notation records a set of parameters, and a set of objects may be generated using a rule with these parameters.  This Clause provides grid geometries that are used in the description of gridded coverages and other applications.
In GML two grid structures are defined, namely gml:Grid and gml:RectifiedGrid.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="geometryBasic0d1d.xsd"/>
	<element name="Grid" type="gml:GridType" substitutionGroup="gml:AbstractImplicitGeometry">
		<annotation>
			<documentation>The gml:Grid implicitly defines an unrectified grid, which is a network composed of two or more sets of curves in which the members of each set intersect the members of the other sets in an algorithmic way.  The region of interest within the grid is given in terms of its gml:limits, being the grid coordinates of  diagonally opposed corners of a rectangular region.  gml:axisLabels is provided with a list of labels of the axes of the grid (gml:axisName has been deprecated). gml:dimension specifies the dimension of the grid.  
The gml:limits element contains a single gml:GridEnvelope. The gml:low and gml:high property elements of the envelope are each integerLists, which are coordinate tuples, the coordinates being measured as offsets from the origin of the grid along each axis, of the diagonally opposing corners of a "rectangular" region of interest.</documentation>
		</annotation>
	</element>
	<element name="AbstractImplicitGeometry" type="gml:AbstractGeometryType" abstract="true" substitutionGroup="gml:AbstractGeometry"/>
	<complexType name="GridType">
		<complexContent>
			<extension base="gml:AbstractGeometryType">
				<sequence>
					<element name="limits" type="gml:GridLimitsType"/>
					<choice>
						<element name="axisLabels" type="gml:NCNameList"/>
						<element name="axisName" type="string" maxOccurs="unbounded"/>
					</choice>
				</sequence>
				<attribute name="dimension" type="positiveInteger" use="required"/>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="GridLimitsType">
		<sequence>
			<element name="GridEnvelope" type="gml:GridEnvelopeType"/>
		</sequence>
	</complexType>
	<complexType name="GridEnvelopeType">
		<sequence>
			<element name="low" type="gml:integerList"/>
			<element name="high" type="gml:integerList"/>
		</sequence>
	</complexType>
	<element name="RectifiedGrid" type="gml:RectifiedGridType" substitutionGroup="gml:Grid">
		<annotation>
			<documentation>A rectified grid is a grid for which there is an affine transformation between the grid coordinates and the coordinates of an external coordinate reference system. It is defined by specifying the position (in some geometric space) of the grid "origin" and of the vectors that specify the post locations.
Note that the grid limits (post indexes) and axis name properties are inherited from gml:GridType and that gml:RectifiedGrid adds a gml:origin property (contains or references a gml:Point) and a set of gml:offsetVector properties.</documentation>
		</annotation>
	</element>
	<complexType name="RectifiedGridType">
		<complexContent>
			<extension base="gml:GridType">
				<sequence>
					<element name="origin" type="gml:PointPropertyType"/>
					<element name="offsetVector" type="gml:VectorType" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/geometryAggregates.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:geometryAggregates:3.2.2">geometryAggregates.xsd</appinfo>
		<documentation>See ISO/DIS 19136 12.3.
Geometric aggregates (i.e. instances of a subtype of gml:AbstractGeometricAggregateType) are arbitrary aggregations of geometry elements. They are not assumed to have any additional internal structure and are used to "collect" pieces of geometry of a specified type. Application schemas may use aggregates for features that use multiple geometric objects in their representations.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="geometryPrimitives.xsd"/>
	<complexType name="AbstractGeometricAggregateType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractGeometryType">
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractGeometricAggregate" type="gml:AbstractGeometricAggregateType" abstract="true" substitutionGroup="gml:AbstractGeometry">
		<annotation>
			<documentation>gml:AbstractGeometricAggregate is the abstract head of the substitution group for all geometric aggregates.</documentation>
		</annotation>
	</element>
	<complexType name="MultiGeometryType">
		<complexContent>
			<extension base="gml:AbstractGeometricAggregateType">
				<sequence>
					<element ref="gml:geometryMember" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:geometryMembers" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="MultiGeometry" type="gml:MultiGeometryType" substitutionGroup="gml:AbstractGeometricAggregate">
		<annotation>
			<documentation>gml:MultiGeometry is a collection of one or more GML geometry objects of arbitrary type. 
The members of the geometric aggregate may be specified either using the "standard" property (gml:geometryMember) or the array property (gml:geometryMembers). It is also valid to use both the "standard" and the array properties in the same collection.</documentation>
		</annotation>
	</element>
	<element name="geometryMember" type="gml:GeometryPropertyType">
		<annotation>
			<documentation>This property element either references a geometry element via the XLink-attributes or contains the geometry element.</documentation>
		</annotation>
	</element>
	<element name="geometryMembers" type="gml:GeometryArrayPropertyType">
		<annotation>
			<documentation>This property element contains a list of geometry elements. The order of the elements is significant and shall be preserved when processing the array.</documentation>
		</annotation>
	</element>
	<complexType name="MultiGeometryPropertyType">
		<annotation>
			<documentation>A property that has a geometric aggregate as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractGeometricAggregate"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="MultiPointType">
		<complexContent>
			<extension base="gml:AbstractGeometricAggregateType">
				<sequence>
					<element ref="gml:pointMember" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:pointMembers" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="MultiPoint" type="gml:MultiPointType" substitutionGroup="gml:AbstractGeometricAggregate">
		<annotation>
			<documentation>A gml:MultiPoint consists of one or more gml:Points.
The members of the geometric aggregate may be specified either using the "standard" property (gml:pointMember) or the array property (gml:pointMembers). It is also valid to use both the "standard" and the array properties in the same collection.</documentation>
		</annotation>
	</element>
	<element name="pointMember" type="gml:PointPropertyType">
		<annotation>
			<documentation>This property element either references a Point via the XLink-attributes or contains the Point element.</documentation>
		</annotation>
	</element>
	<element name="pointMembers" type="gml:PointArrayPropertyType">
		<annotation>
			<documentation>This property element contains a list of points. The order of the elements is significant and shall be preserved when processing the array.</documentation>
		</annotation>
	</element>
	<complexType name="MultiPointPropertyType">
		<annotation>
			<documentation>A property that has a collection of points as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:MultiPoint"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="MultiCurveType">
		<complexContent>
			<extension base="gml:AbstractGeometricAggregateType">
				<sequence>
					<element ref="gml:curveMember" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:curveMembers" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="MultiCurve" type="gml:MultiCurveType" substitutionGroup="gml:AbstractGeometricAggregate">
		<annotation>
			<documentation>A gml:MultiCurve is defined by one or more gml:AbstractCurves.
The members of the geometric aggregate may be specified either using the "standard" property (gml:curveMember) or the array property (gml:curveMembers). It is also valid to use both the "standard" and the array properties in the same collection.</documentation>
		</annotation>
	</element>
	<element name="curveMembers" type="gml:CurveArrayPropertyType">
		<annotation>
			<documentation>This property element contains a list of curves. The order of the elements is significant and shall be preserved when processing the array.</documentation>
		</annotation>
	</element>
	<complexType name="MultiCurvePropertyType">
		<annotation>
			<documentation>A property that has a collection of curves as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:MultiCurve"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="MultiSurfaceType">
		<complexContent>
			<extension base="gml:AbstractGeometricAggregateType">
				<sequence>
					<element ref="gml:surfaceMember" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:surfaceMembers" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="MultiSurface" type="gml:MultiSurfaceType" substitutionGroup="gml:AbstractGeometricAggregate">
		<annotation>
			<documentation>A gml:MultiSurface is defined by one or more gml:AbstractSurfaces.
The members of the geometric aggregate may be specified either using the "standard" property (gml:surfaceMember) or the array property (gml:surfaceMembers). It is also valid to use both the "standard" and the array properties in the same collection.</documentation>
		</annotation>
	</element>
	<element name="surfaceMembers" type="gml:SurfaceArrayPropertyType">
		<annotation>
			<documentation>This property element contains a list of surfaces. The order of the elements is significant and shall be preserved when processing the array.</documentation>
		</annotation>
	</element>
	<complexType name="MultiSurfacePropertyType">
		<annotation>
			<documentation>A property that has a collection of surfaces as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:MultiSurface"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="MultiSolidType">
		<complexContent>
			<extension base="gml:AbstractGeometricAggregateType">
				<sequence>
					<element ref="gml:solidMember" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:solidMembers" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="MultiSolid" type="gml:MultiSolidType" substitutionGroup="gml:AbstractGeometricAggregate">
		<annotation>
			<documentation>A gml:MultiSolid is defined by one or more gml:AbstractSolids.
The members of the geometric aggregate may be specified either using the "standard" property (gml:solidMember) or the array property (gml:solidMembers). It is also valid to use both the "standard" and the array properties in the same collection.</documentation>
		</annotation>
	</element>
	<element name="solidMember" type="gml:SolidPropertyType">
		<annotation>
			<documentation>This property element either references a solid via the XLink-attributes or contains the solid element. A solid element is any element, which is substitutable for gml:AbstractSolid.</documentation>
		</annotation>
	</element>
	<element name="solidMembers" type="gml:SolidArrayPropertyType">
		<annotation>
			<documentation>This property element contains a list of solids. The order of the elements is significant and shall be preserved when processing the array.</documentation>
		</annotation>
	</element>
	<complexType name="MultiSolidPropertyType">
		<annotation>
			<documentation>A property that has a collection of solids as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:MultiSolid"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/coordinateSystems.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" xml:lang="en"  version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:coordinateSystems:3.2.2">coordinateSystems.xsd</appinfo>
		<documentation>See ISO/DIS 19136 13.4.
The coordinate systems schema components can be divded into  three logical parts, which define elements and types for XML encoding of the definitions of:
-	Coordinate system axes
-	Abstract coordinate system
-	Multiple concrete types of spatial-temporal coordinate systems
These schema components encode the Coordinate System packages of the UML Models of ISO 19111 Clause 9 and ISO/DIS 19136 D.3.10.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="referenceSystems.xsd"/>
	<element name="CoordinateSystemAxis" type="gml:CoordinateSystemAxisType" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>gml:CoordinateSystemAxis is a definition of a coordinate system axis.</documentation>
		</annotation>
	</element>
	<complexType name="CoordinateSystemAxisType">
		<complexContent>
			<extension base="gml:IdentifiedObjectType">
				<sequence>
					<element ref="gml:axisAbbrev"/>
					<element ref="gml:axisDirection"/>
					<element ref="gml:minimumValue" minOccurs="0"/>
					<element ref="gml:maximumValue" minOccurs="0"/>
					<element ref="gml:rangeMeaning" minOccurs="0"/>
				</sequence>
				<attribute name="uom" type="gml:UomIdentifier" use="required">
					<annotation>
						<documentation>The uom attribute provides an identifier of the unit of measure used for this coordinate system axis. The value of this coordinate in a coordinate tuple shall be recorded using this unit of measure, whenever those coordinates use a coordinate reference system that uses a coordinate system that uses this axis.</documentation>
					</annotation>
				</attribute>
			</extension>
		</complexContent>
	</complexType>
	<element name="axisAbbrev" type="gml:CodeType">
		<annotation>
			<documentation>gml:axisAbbrev is the abbreviation used for this coordinate system axis; this abbreviation is also used to identify the coordinates in the coordinate tuple. The codeSpace attribute may reference a source of more information on a set of standardized abbreviations, or on this abbreviation.</documentation>
		</annotation>
	</element>
	<element name="axisDirection" type="gml:CodeWithAuthorityType">
		<annotation>
			<documentation>gml:axisDirection is the direction of this coordinate system axis (or in the case of Cartesian projected coordinates, the direction of this coordinate system axis at the origin).
Within any set of coordinate system axes, only one of each pair of terms may be used. For earth-fixed CRSs, this direction is often approximate and intended to provide a human interpretable meaning to the axis. When a geodetic datum is used, the precise directions of the axes may therefore vary slightly from this approximate direction.
The codeSpace attribute shall reference a source of information specifying the values and meanings of all the allowed string values for this property.</documentation>
		</annotation>
	</element>
	<element name="minimumValue" type="double">
		<annotation>
			<documentation>The gml:minimumValue and gml:maximumValue properties allow the specification of minimum and maximum value normally allowed for this axis, in the unit of measure for the axis. For a continuous angular axis such as longitude, the values wrap-around at this value. Also, values beyond this minimum/maximum can be used for specified purposes, such as in a bounding box. A value of minus infinity shall be allowed for the gml:minimumValue element, a value of plus infiniy for the gml:maximumValue element. If these elements are omitted, the value is unspecified.</documentation>
		</annotation>
	</element>
	<element name="maximumValue" type="double">
		<annotation>
			<documentation>The gml:minimumValue and gml:maximumValue properties allow the specification of minimum and maximum value normally allowed for this axis, in the unit of measure for the axis. For a continuous angular axis such as longitude, the values wrap-around at this value. Also, values beyond this minimum/maximum can be used for specified purposes, such as in a bounding box. A value of minus infinity shall be allowed for the gml:minimumValue element, a value of plus infiniy for the gml:maximumValue element. If these elements are omitted, the value is unspecified.</documentation>
		</annotation>
	</element>
	<element name="rangeMeaning" type="gml:CodeWithAuthorityType">
		<annotation>
			<documentation>gml:rangeMeaning describes the meaning of axis value range specified by gml:minimumValue and gml:maximumValue. This element shall be omitted when both gml:minimumValue and gml:maximumValue are omitted. This element should be included when gml:minimumValue and/or gml:maximumValue are included. If this element is omitted when the gml:minimumValue and/or gml:maximumValue are included, the meaning is unspecified. The codeSpace attribute shall reference a source of information specifying the values and meanings of all the allowed string values for this property.</documentation>
		</annotation>
	</element>
	<complexType name="CoordinateSystemAxisPropertyType">
		<annotation>
			<documentation>gml:CoordinateSystemAxisPropertyType is a property type for association roles to a coordinate system axis, either referencing or containing the definition of that axis.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:CoordinateSystemAxis"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="AbstractCoordinateSystem" type="gml:AbstractCoordinateSystemType" abstract="true" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>gml:AbstractCoordinateSystem is a coordinate system (CS) is the non-repeating sequence of coordinate system axes that spans a given coordinate space. A CS is derived from a set of mathematical rules for specifying how coordinates in a given space are to be assigned to points. The coordinate values in a coordinate tuple shall be recorded in the order in which the coordinate system axes associations are recorded. This abstract complex type shall not be used, extended, or restricted, in an Application Schema, to define a concrete subtype with a meaning equivalent to a concrete subtype specified in this document.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractCoordinateSystemType" abstract="true">
		<complexContent>
			<extension base="gml:IdentifiedObjectType">
				<sequence>
					<element ref="gml:axis" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="axis" type="gml:CoordinateSystemAxisPropertyType">
		<annotation>
			<documentation>The gml:axis property is an association role (ordered sequence) to the coordinate system axes included in this coordinate system. The coordinate values in a coordinate tuple shall be recorded in the order in which the coordinate system axes associations are recorded, whenever those coordinates use a coordinate reference system that uses this coordinate system. The gml:AggregationAttributeGroup should be used to specify that the axis objects are ordered.</documentation>
		</annotation>
	</element>
	<complexType name="CoordinateSystemPropertyType">
		<annotation>
			<documentation>gml:CoordinateSystemPropertyType is a property type for association roles to a coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractCoordinateSystem"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="EllipsoidalCS" type="gml:EllipsoidalCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:EllipsoidalCS is a two- or three-dimensional coordinate system in which position is specified by geodetic latitude, geodetic longitude, and (in the three-dimensional case) ellipsoidal height. An EllipsoidalCS shall have two or three gml:axis property elements; the number of associations shall equal the dimension of the CS.</documentation>
		</annotation>
	</element>
	<complexType name="EllipsoidalCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="EllipsoidalCSPropertyType">
		<annotation>
			<documentation>gml:EllipsoidalCSPropertyType is a property type for association roles to an ellipsoidal coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:EllipsoidalCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="CartesianCS" type="gml:CartesianCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:CartesianCS is a 1-, 2-, or 3-dimensional coordinate system. In the 1-dimensional case, it contains a single straight coordinate axis. In the 2- and 3-dimensional cases gives the position of points relative to orthogonal straight axes. In the multi-dimensional case, all axes shall have the same length unit of measure. A CartesianCS shall have one, two, or three gml:axis property elements.</documentation>
		</annotation>
	</element>
	<complexType name="CartesianCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="CartesianCSPropertyType">
		<annotation>
			<documentation>gml:CartesianCSPropertyType is a property type for association roles to a Cartesian coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:CartesianCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="VerticalCS" type="gml:VerticalCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:VerticalCS is a one-dimensional coordinate system used to record the heights or depths of points. Such a coordinate system is usually dependent on the Earth's gravity field, perhaps loosely as when atmospheric pressure is the basis for the vertical coordinate system axis. A VerticalCS shall have one gml:axis property element.</documentation>
		</annotation>
	</element>
	<complexType name="VerticalCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="VerticalCSPropertyType">
		<annotation>
			<documentation>gml:VerticalCSPropertyType is a property type for association roles to a vertical coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:VerticalCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="TimeCS" type="gml:TimeCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:TimeCS is a one-dimensional coordinate system containing a time axis, used to describe the temporal position of a point in the specified time units from a specified time origin. A TimeCS shall have one gml:axis property element.</documentation>
		</annotation>
	</element>
	<complexType name="TimeCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="TimeCSPropertyType">
		<annotation>
			<documentation>gml:TimeCSPropertyType is a property type for association roles to a time coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimeCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="LinearCS" type="gml:LinearCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:LinearCS is a one-dimensional coordinate system that consists of the points that lie on the single axis described. The associated coordinate is the distance – with or without offset – from the specified datum to the point along the axis. A LinearCS shall have one gml:axis property element.</documentation>
		</annotation>
	</element>
	<complexType name="LinearCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="LinearCSPropertyType">
		<annotation>
			<documentation>gml:LinearCSPropertyType is a property type for association roles to a linear coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:LinearCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="UserDefinedCS" type="gml:UserDefinedCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:UserDefinedCS is a two- or three-dimensional coordinate system that consists of any combination of coordinate axes not covered by any other coordinate system type. A UserDefinedCS shall have two or three gml:axis property elements; the number of property elements shall equal the dimension of the CS.</documentation>
		</annotation>
	</element>
	<complexType name="UserDefinedCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="UserDefinedCSPropertyType">
		<annotation>
			<documentation>gml:UserDefinedCSPropertyType is a property type for association roles to a user-defined coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:UserDefinedCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="SphericalCS" type="gml:SphericalCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:SphericalCS is a three-dimensional coordinate system with one distance measured from the origin and two angular coordinates. A SphericalCS shall have three gml:axis property elements.</documentation>
		</annotation>
	</element>
	<complexType name="SphericalCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="SphericalCSPropertyType">
		<annotation>
			<documentation>gml:SphericalCSPropertyType is property type for association roles to a spherical coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:SphericalCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="PolarCS" type="gml:PolarCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:PolarCS ia s two-dimensional coordinate system in which position is specified by the distance from the origin and the angle between the line from the origin to a point and a reference direction. A PolarCS shall have two gml:axis property elements.</documentation>
		</annotation>
	</element>
	<complexType name="PolarCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="PolarCSPropertyType">
		<annotation>
			<documentation>gml:PolarCSPropertyType is a property type for association roles to a polar coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:PolarCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="CylindricalCS" type="gml:CylindricalCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:CylindricalCS is a three-dimensional coordinate system consisting of a polar coordinate system extended by a straight coordinate axis perpendicular to the plane spanned by the polar coordinate system. A CylindricalCS shall have three gml:axis property elements.</documentation>
		</annotation>
	</element>
	<complexType name="CylindricalCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="CylindricalCSPropertyType">
		<annotation>
			<documentation>gml:CylindricalCSPropertyType is a property type for association roles to a cylindrical coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:CylindricalCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="AffineCS" type="gml:AffineCSType" substitutionGroup="gml:AbstractCoordinateSystem">
		<annotation>
			<documentation>gml:AffineCS is a two- or three-dimensional coordinate system with straight axes that are not necessarily orthogonal. An AffineCS shall have two or three gml:axis property elements; the number of property elements shall equal the dimension of the CS.</documentation>
		</annotation>
	</element>
	<complexType name="AffineCSType">
		<complexContent>
			<extension base="gml:AbstractCoordinateSystemType"/>
		</complexContent>
	</complexType>
	<complexType name="AffineCSPropertyType">
		<annotation>
			<documentation>gml:AffineCSPropertyType is a property type for association roles to an affine coordinate system, either referencing or containing the definition of that coordinate system.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AffineCS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/datums.xsd',`
<!-- edited with XMLSPY v5 rel. 2 U (http://www.xmlspy.com) by Clemens Portele (interactive instruments) -->
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" xml:lang="en" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:datums:3.2.2">datums.xsd</appinfo>
		<documentation>See ISO/DIS 19136 13.5
The datums schema components can be divided into three logical parts, which define elements and types for XML encoding of the definitions of:
-	Abstract datum
-	Geodetic datums, including ellipsoid and prime meridian
-	Multiple other concrete types of spatial or temporal datums
These schema components encode the Datum packages of the UML Models of ISO 19111 Clause 10 and ISO/DIS 19136 D.3.10.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="referenceSystems.xsd"/>
	<include schemaLocation="measures.xsd"/>
	<element name="AbstractDatum" type="gml:AbstractDatumType" abstract="true" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>A gml:AbstractDatum specifies the relationship of a coordinate system to the earth, thus creating a coordinate reference system. A datum uses a parameter or set of parameters that determine the location of the origin of the coordinate reference system. Each datum subtype may be associated with only specific types of coordinate systems. This abstract complex type shall not be used, extended, or restricted, in a GML Application Schema, to define a concrete subtype with a meaning equivalent to a concrete subtype specified in this document.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractDatumType" abstract="true">
		<complexContent>
			<extension base="gml:IdentifiedObjectType">
				<sequence>
					<element ref="gml:domainOfValidity" minOccurs="0"/>
					<element ref="gml:scope" maxOccurs="unbounded"/>
					<element ref="gml:anchorDefinition" minOccurs="0"/>
					<element ref="gml:realizationEpoch" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="anchorDefinition" type="gml:CodeType">
		<annotation>
			<documentation>gml:anchorDefinition is a description, possibly including coordinates, of the definition used to anchor the datum to the Earth. Also known as the "origin", especially for engineering and image datums. The codeSpace attribute may be used to reference a source of more detailed on this point or surface, or on a set of such descriptions.
-	For a geodetic datum, this point is also known as the fundamental point, which is traditionally the point where the relationship between geoid and ellipsoid is defined. In some cases, the "fundamental point" may consist of a number of points. In those cases, the parameters defining the geoid/ellipsoid relationship have been averaged for these points, and the averages adopted as the datum definition.
-	For an engineering datum, the anchor definition may be a physical point, or it may be a point with defined coordinates in another CRS.may
-	For an image datum, the anchor definition is usually either the centre of the image or the corner of the image.
-	For a temporal datum, this attribute is not defined. Instead of the anchor definition, a temporal datum carries a separate time origin of type DateTime.</documentation>
		</annotation>
	</element>
	<element name="realizationEpoch" type="date">
		<annotation>
			<documentation>gml:realizationEpoch is the time after which this datum definition is valid. See ISO 19111 Table 32 for details.</documentation>
		</annotation>
	</element>
	<complexType name="DatumPropertyType">
		<annotation>
			<documentation>gml:DatumPropertyType is a property type for association roles to a datum, either referencing or containing the definition of that datum.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractDatum"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="GeodeticDatum" type="gml:GeodeticDatumType" substitutionGroup="gml:AbstractDatum">
		<annotation>
			<documentation>gml:GeodeticDatum is a geodetic datum defines the precise location and orientation in 3-dimensional space of a defined ellipsoid (or sphere), or of a Cartesian coordinate system centered in this ellipsoid (or sphere).</documentation>
		</annotation>
	</element>
	<complexType name="GeodeticDatumType">
		<complexContent>
			<extension base="gml:AbstractDatumType">
				<sequence>
					<element ref="gml:primeMeridian"/>
					<element ref="gml:ellipsoid"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="primeMeridian" type="gml:PrimeMeridianPropertyType">
		<annotation>
			<documentation>gml:primeMeridian is an association role to the prime meridian used by this geodetic datum.</documentation>
		</annotation>
	</element>
	<element name="ellipsoid" type="gml:EllipsoidPropertyType">
		<annotation>
			<documentation>gml:ellipsoid is an association role to the ellipsoid used by this geodetic datum.</documentation>
		</annotation>
	</element>
	<complexType name="GeodeticDatumPropertyType">
		<annotation>
			<documentation>gml:GeodeticDatumPropertyType is a property type for association roles to a geodetic datum, either referencing or containing the definition of that datum.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:GeodeticDatum"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="Ellipsoid" type="gml:EllipsoidType" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>A gml:Ellipsoid is a geometric figure that may be used to describe the approximate shape of the earth. In mathematical terms, it is a surface formed by the rotation of an ellipse about its minor axis.</documentation>
		</annotation>
	</element>
	<complexType name="EllipsoidType">
		<complexContent>
			<extension base="gml:IdentifiedObjectType">
				<sequence>
					<element ref="gml:semiMajorAxis"/>
					<element ref="gml:secondDefiningParameter"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="semiMajorAxis" type="gml:MeasureType">
		<annotation>
			<documentation>gml:semiMajorAxis specifies the length of the semi-major axis of the ellipsoid, with its units. Uses the MeasureType with the restriction that the unit of measure referenced by uom must be suitable for a length, such as metres or feet.</documentation>
		</annotation>
	</element>
	<element name="secondDefiningParameter">
		<annotation>
			<documentation>gml:secondDefiningParameter is a property containing the definition of the second parameter that defines the shape of an ellipsoid. An ellipsoid requires two defining parameters: semi-major axis and inverse flattening or semi-major axis and semi-minor axis. When the reference body is a sphere rather than an ellipsoid, only a single defining parameter is required, namely the radius of the sphere; in that case, the semi-major axis "degenerates" into the radius of the sphere.
The inverseFlattening element contains the inverse flattening value of the ellipsoid. This value is a scale factor (or ratio). It uses gml:LengthType with the restriction that the unit of measure referenced by the uom attribute must be suitable for a scale factor, such as percent, permil, or parts-per-million.
The semiMinorAxis element contains the length of the semi-minor axis of the ellipsoid. When the isSphere element is included, the ellipsoid is degenerate and is actually a sphere. The sphere is completely defined by the semi-major axis, which is the radius of the sphere.</documentation>
		</annotation>
		<complexType>
			<sequence>
				<element ref="gml:SecondDefiningParameter"/>
			</sequence>
		</complexType>
	</element>
	<element name="SecondDefiningParameter">
		<complexType>
			<choice>
				<element name="inverseFlattening" type="gml:MeasureType"/>
				<element name="semiMinorAxis" type="gml:LengthType"/>
				<element name="isSphere" type="boolean" default="true"/>
			</choice>
		</complexType>
	</element>
	<complexType name="EllipsoidPropertyType">
		<annotation>
			<documentation>gml:EllipsoidPropertyType is a property type for association roles to an ellipsoid, either referencing or containing the definition of that ellipsoid.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:Ellipsoid"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="PrimeMeridian" type="gml:PrimeMeridianType" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>A gml:PrimeMeridian defines the origin from which longitude values are determined. The default value for the prime meridian gml:identifier value is "Greenwich".</documentation>
		</annotation>
	</element>
	<complexType name="PrimeMeridianType">
		<complexContent>
			<extension base="gml:IdentifiedObjectType">
				<sequence>
					<element ref="gml:greenwichLongitude"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="greenwichLongitude" type="gml:AngleType">
		<annotation>
			<documentation>gml:greenwichLongitude is the longitude of the prime meridian measured from the Greenwich meridian, positive eastward. If the value of the prime meridian "name" is "Greenwich" then the value of greenwichLongitude shall be 0 degrees.</documentation>
		</annotation>
	</element>
	<complexType name="PrimeMeridianPropertyType">
		<annotation>
			<documentation>gml:PrimeMeridianPropertyType is a property type for association roles to a prime meridian, either referencing or containing the definition of that meridian.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:PrimeMeridian"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="EngineeringDatum" type="gml:EngineeringDatumType" substitutionGroup="gml:AbstractDatum">
		<annotation>
			<documentation>gml:EngineeringDatum defines the origin of an engineering coordinate reference system, and is used in a region around that origin. This origin may be fixed with respect to the earth (such as a defined point at a construction site), or be a defined point on a moving vehicle (such as on a ship or satellite).</documentation>
		</annotation>
	</element>
	<complexType name="EngineeringDatumType">
		<complexContent>
			<extension base="gml:AbstractDatumType"/>
		</complexContent>
	</complexType>
	<complexType name="EngineeringDatumPropertyType">
		<annotation>
			<documentation>gml:EngineeringDatumPropertyType is a property type for association roles to an engineering datum, either referencing or containing the definition of that datum.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:EngineeringDatum"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="ImageDatum" type="gml:ImageDatumType" substitutionGroup="gml:AbstractDatum">
		<annotation>
			<documentation>gml:ImageDatum defines the origin of an image coordinate reference system, and is used in a local context only. For an image datum, the anchor definition is usually either the centre of the image or the corner of the image. For more information, see ISO 19111 B.3.5.</documentation>
		</annotation>
	</element>
	<complexType name="ImageDatumType">
		<complexContent>
			<extension base="gml:AbstractDatumType">
				<sequence>
					<element ref="gml:pixelInCell"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="pixelInCell" type="gml:CodeWithAuthorityType">
		<annotation>
			<documentation>gml:pixelInCell is a specification of the way an image grid is associated with the image data attributes. The required codeSpace attribute shall reference a source of information specifying the values and meanings of all the allowed string values for this property.</documentation>
		</annotation>
	</element>
	<complexType name="ImageDatumPropertyType">
		<annotation>
			<documentation>gml:ImageDatumPropertyType is a property type for association roles to an image datum, either referencing or containing the definition of that datum.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:ImageDatum"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="VerticalDatum" type="gml:VerticalDatumType" substitutionGroup="gml:AbstractDatum">
		<annotation>
			<documentation>gml:VerticalDatum is a textual description and/or a set of parameters identifying a particular reference level surface used as a zero-height surface, including its position with respect to the Earth for any of the height types recognized by this International Standard.</documentation>
		</annotation>
	</element>
	<complexType name="VerticalDatumType">
		<complexContent>
			<extension base="gml:AbstractDatumType"/>
		</complexContent>
	</complexType>
	<complexType name="VerticalDatumPropertyType">
		<annotation>
			<documentation>gml:VerticalDatumPropertyType is property type for association roles to a vertical datum, either referencing or containing the definition of that datum.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:VerticalDatum"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="TemporalDatum" type="gml:TemporalDatumType" substitutionGroup="gml:AbstractDatum">
		<annotation>
			<documentation>A gml:TemporalDatum defines the origin of a Temporal Reference System. This type omits the "anchorDefinition" and "realizationEpoch" elements and adds the "origin" element with the dateTime type.</documentation>
		</annotation>
	</element>
	<complexType name="TemporalDatumType">
		<complexContent>
			<extension base="gml:TemporalDatumBaseType">
				<sequence>
					<element ref="gml:origin"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TemporalDatumBaseType" abstract="true">
		<annotation>
			<documentation>The TemporalDatumBaseType partially defines the origin of a temporal coordinate reference system. This type restricts the AbstractDatumType to remove the "anchorDefinition" and "realizationEpoch" elements.</documentation>
		</annotation>
		<complexContent>
			<restriction base="gml:AbstractDatumType">
				<sequence>
					<element ref="gml:metaDataProperty" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:description" minOccurs="0"/>
					<element ref="gml:descriptionReference" minOccurs="0"/>
					<element ref="gml:identifier"/>
					<element ref="gml:name" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:remarks" minOccurs="0"/>
					<element ref="gml:domainOfValidity" minOccurs="0"/>
					<element ref="gml:scope" maxOccurs="unbounded"/>
				</sequence>
				<attribute ref="gml:id" use="required"/>
			</restriction>
		</complexContent>
	</complexType>
	<element name="origin" type="dateTime">
		<annotation>
			<documentation>gml:origin is the date and time origin of this temporal datum.</documentation>
		</annotation>
	</element>
	<complexType name="TemporalDatumPropertyType">
		<annotation>
			<documentation>gml:TemporalDatumPropertyType is a property type for association roles to a temporal datum, either referencing or containing the definition of that datum.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TemporalDatum"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/coordinateOperations.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" xml:lang="en" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns="http://www.w3.org/2001/XMLSchema" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:coordinateOperations:3.2.2">coordinateOperations.xsd</appinfo>
		<documentation>See ISO/DIS 19136 13.6.
The spatial or temporal coordinate operations schema components can be divided into five logical parts, which define elements and types for XML encoding of the definitions of:
-	Multiple abstract coordinate operations
-	Multiple concrete types of coordinate operations, including Transformations and Conversions
-	Abstract and concrete parameter values and groups
-	Operation methods
-	Abstract and concrete operation parameters and groups
These schema component encodes the Coordinate Operation package of the UML Model for ISO 19111 Clause 11.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="referenceSystems.xsd"/>
	<include schemaLocation="measures.xsd"/>
	<import namespace="http://www.isotc211.org/2005/gmd" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gmd/gmd.xsd"/>
	<element name="AbstractCoordinateOperation" type="gml:AbstractCoordinateOperationType" abstract="true" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>gml:AbstractCoordinateOperation is a mathematical operation on coordinates that transforms or converts coordinates to another coordinate reference system. Many but not all coordinate operations (from CRS A to CRS B) also uniquely define the inverse operation (from CRS B to CRS A). In some cases, the operation method algorithm for the inverse operation is the same as for the forward algorithm, but the signs of some operation parameter values shall be reversed. In other cases, different algorithms are required for the forward and inverse operations, but the same operation parameter values are used. If (some) entirely different parameter values are needed, a different coordinate operation shall be defined.
The optional coordinateOperationAccuracy property elements provide estimates of the impact of this coordinate operation on point position accuracy.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractCoordinateOperationType" abstract="true">
		<complexContent>
			<extension base="gml:IdentifiedObjectType">
				<sequence>
					<element ref="gml:domainOfValidity" minOccurs="0"/>
					<element ref="gml:scope" maxOccurs="unbounded"/>
					<element ref="gml:operationVersion" minOccurs="0"/>
					<element ref="gml:coordinateOperationAccuracy" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:sourceCRS" minOccurs="0"/>
					<element ref="gml:targetCRS" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="operationVersion" type="string">
		<annotation>
			<documentation>gml:operationVersion is the version of the coordinate transformation (i.e., instantiation due to the stochastic nature of the parameters). Mandatory when describing a transformation, and should not be supplied for a conversion.</documentation>
		</annotation>
	</element>
	<element name="coordinateOperationAccuracy">
		<annotation>
			<documentation>gml:coordinateOperationAccuracy is an association role to a DQ_PositionalAccuracy object as encoded in ISO/TS 19139, either referencing or containing the definition of that positional accuracy. That object contains an estimate of the impact of this coordinate operation on point accuracy. That is, it gives position error estimates for the target coordinates of this coordinate operation, assuming no errors in the source coordinates.</documentation>
		</annotation>
		<complexType>
			<sequence minOccurs="0">
				<element ref="gmd:AbstractDQ_PositionalAccuracy"/>
			</sequence>
			<attributeGroup ref="gml:AssociationAttributeGroup"/>
		</complexType>
	</element>
	<element name="sourceCRS" type="gml:CRSPropertyType">
		<annotation>
			<documentation>gml:sourceCRS is an association role to the source CRS (coordinate reference system) of this coordinate operation.</documentation>
		</annotation>
	</element>
	<element name="targetCRS" type="gml:CRSPropertyType">
		<annotation>
			<documentation>gml:targetCRS is an association role to the target CRS (coordinate reference system) of this coordinate operation.</documentation>
		</annotation>
	</element>
	<complexType name="CoordinateOperationPropertyType">
		<annotation>
			<documentation>gml:CoordinateOperationPropertyType is a property type for association roles to a coordinate operation, either referencing or containing the definition of that coordinate operation.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractCoordinateOperation"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="AbstractSingleOperation" type="gml:AbstractCoordinateOperationType" abstract="true" substitutionGroup="gml:AbstractCoordinateOperation">
		<annotation>
			<documentation>gml:AbstractSingleOperation is a single (not concatenated) coordinate operation.</documentation>
		</annotation>
	</element>
	<complexType name="SingleOperationPropertyType">
		<annotation>
			<documentation>gml:SingleOperationPropertyType is a property type for association roles to a single operation, either referencing or containing the definition of that single operation.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractSingleOperation"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="AbstractGeneralConversion" type="gml:AbstractGeneralConversionType" abstract="true" substitutionGroup="gml:AbstractOperation">
		<annotation>
			<documentation>gm:AbstractGeneralConversion is an abstract operation on coordinates that does not include any change of datum. The best-known example of a coordinate conversion is a map projection. The parameters describing coordinate conversions are defined rather than empirically derived. Note that some conversions have no parameters. The operationVersion, sourceCRS, and targetCRS elements are omitted in a coordinate conversion.
This abstract complex type is expected to be extended for well-known operation methods with many Conversion instances, in GML Application Schemas that define operation-method-specialized element names and contents. This conversion uses an operation method, usually with associated parameter values. However, operation methods and parameter values are directly associated with concrete subtypes, not with this abstract type. All concrete types derived from this type shall extend this type to include a "usesMethod" element that references the "OperationMethod" element. Similarly, all concrete types derived from this type shall extend this type to include zero or more elements each named "uses...Value" that each use the type of an element substitutable for the "AbstractGeneralParameterValue" element.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractGeneralConversionType" abstract="true">
		<complexContent>
			<restriction base="gml:AbstractCoordinateOperationType">
				<sequence>
					<element ref="gml:metaDataProperty" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:description" minOccurs="0"/>
					<element ref="gml:descriptionReference" minOccurs="0"/>
					<element ref="gml:identifier"/>
					<element ref="gml:name" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:remarks" minOccurs="0"/>
					<element ref="gml:domainOfValidity" minOccurs="0"/>
					<element ref="gml:scope" maxOccurs="unbounded"/>
					<element ref="gml:coordinateOperationAccuracy" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
				<attribute ref="gml:id" use="required"/>
			</restriction>
		</complexContent>
	</complexType>
	<complexType name="GeneralConversionPropertyType">
		<annotation>
			<documentation>gml:GeneralConversionPropertyType is a property type for association roles to a general conversion, either referencing or containing the definition of that conversion.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractGeneralConversion"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="AbstractGeneralTransformation" type="gml:AbstractGeneralTransformationType" abstract="true" substitutionGroup="gml:AbstractOperation">
		<annotation>
			<documentation>gml:AbstractGeneralTransformation is an abstract operation on coordinates that usually includes a change of Datum. The parameters of a coordinate transformation are empirically derived from data containing the coordinates of a series of points in both coordinate reference systems. This computational process is usually "over-determined", allowing derivation of error (or accuracy) estimates for the transformation. Also, the stochastic nature of the parameters may result in multiple (different) versions of the same coordinate transformation. The operationVersion, sourceCRS, and targetCRS proeprty elements are mandatory in a coordinate transformation.
This abstract complex type is expected to be extended for well-known operation methods with many Transformation instances, in Application Schemas that define operation-method-specialized value element names and contents. This transformation uses an operation method with associated parameter values. However, operation methods and parameter values are directly associated with concrete subtypes, not with this abstract type. All concrete types derived from this type shall extend this type to include a "usesMethod" element that references one "OperationMethod" element. Similarly, all concrete types derived from this type shall extend this type to include one or more elements each named "uses...Value" that each use the type of an element substitutable for the "AbstractGeneralParameterValue" element.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractGeneralTransformationType" abstract="true">
		<complexContent>
			<restriction base="gml:AbstractCoordinateOperationType">
				<sequence>
					<element ref="gml:metaDataProperty" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:description" minOccurs="0"/>
					<element ref="gml:descriptionReference" minOccurs="0"/>
					<element ref="gml:identifier"/>
					<element ref="gml:name" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:remarks" minOccurs="0"/>
					<element ref="gml:domainOfValidity" minOccurs="0"/>
					<element ref="gml:scope" maxOccurs="unbounded"/>
					<element ref="gml:operationVersion"/>
					<element ref="gml:coordinateOperationAccuracy" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:sourceCRS"/>
					<element ref="gml:targetCRS"/>
				</sequence>
				<attribute ref="gml:id" use="required"/>
			</restriction>
		</complexContent>
	</complexType>
	<complexType name="GeneralTransformationPropertyType">
		<annotation>
			<documentation>gml:GeneralTransformationPropertyType is a property type for association roles to a general transformation, either referencing or containing the definition of that transformation.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractGeneralTransformation"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="ConcatenatedOperation" type="gml:ConcatenatedOperationType" substitutionGroup="gml:AbstractCoordinateOperation"/>
	<complexType name="ConcatenatedOperationType">
		<annotation>
			<documentation>gml:ConcatenatedOperation is an ordered sequence of two or more coordinate operations. This sequence of operations is constrained by the requirement that the source coordinate reference system of step (n+1) must be the same as the target coordinate reference system of step (n). The source coordinate reference system of the first step and the target coordinate reference system of the last step are the source and target coordinate reference system associated with the concatenated operation. Instead of a forward operation, an inverse operation may be used for one or more of the operation steps mentioned above, if the inverse operation is uniquely defined by the forward operation.
The gml:coordOperation property elements are an ordered sequence of associations to the two or more operations used by this concatenated operation. The AggregationAttributeGroup should be used to specify that the coordOperation associations are ordered.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractCoordinateOperationType">
				<sequence>
					<element ref="gml:coordOperation" minOccurs="2" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="coordOperation" type="gml:CoordinateOperationPropertyType">
		<annotation>
			<documentation>gml:coordOperation is an association role to a coordinate operation.</documentation>
		</annotation>
	</element>
	<complexType name="ConcatenatedOperationPropertyType">
		<annotation>
			<documentation>gml:ConcatenatedOperationPropertyType is a property type for association roles to a concatenated operation, either referencing or containing the definition of that concatenated operation.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:ConcatenatedOperation"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="PassThroughOperation" type="gml:PassThroughOperationType" substitutionGroup="gml:AbstractSingleOperation">
		<annotation>
			<documentation>gml:PassThroughOperation is a pass-through operation specifies that a subset of a coordinate tuple is subject to a specific coordinate operation.
The modifiedCoordinate property elements are an ordered sequence of positive integers defining the positions in a coordinate tuple of the coordinates affected by this pass-through operation. The AggregationAttributeGroup should be used to specify that the modifiedCoordinate elements are ordered.</documentation>
		</annotation>
	</element>
	<complexType name="PassThroughOperationType">
		<complexContent>
			<extension base="gml:AbstractCoordinateOperationType">
				<sequence>
					<element ref="gml:modifiedCoordinate" maxOccurs="unbounded"/>
					<element ref="gml:coordOperation"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="modifiedCoordinate" type="positiveInteger">
		<annotation>
			<documentation>gml:modifiedCoordinate is a positive integer defining a position in a coordinate tuple.</documentation>
		</annotation>
	</element>
	<complexType name="PassThroughOperationPropertyType">
		<annotation>
			<documentation>gml:PassThroughOperationPropertyType is a property type for association roles to a pass through operation, either referencing or containing the definition of that pass through operation.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:PassThroughOperation"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="Conversion" type="gml:ConversionType" substitutionGroup="gml:AbstractGeneralConversion">
		<annotation>
			<documentation>gml:Conversion is a concrete operation on coordinates that does not include any change of Datum. The best-known example of a coordinate conversion is a map projection. The parameters describing coordinate conversions are defined rather than empirically derived. Note that some conversions have no parameters.
This concrete complex type can be used without using a GML Application Schema that defines operation-method-specialized element names and contents, especially for methods with only one Conversion instance.
The usesValue property elements are an unordered list of composition associations to the set of parameter values used by this conversion operation.</documentation>
		</annotation>
	</element>
	<complexType name="ConversionType">
		<complexContent>
			<extension base="gml:AbstractGeneralConversionType">
				<sequence>
					<element ref="gml:method"/>
					<element ref="gml:parameterValue" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="method" type="gml:OperationMethodPropertyType">
		<annotation>
			<documentation>gml:method is an association role to the operation method used by a coordinate operation.</documentation>
		</annotation>
	</element>
	<element name="parameterValue" type="gml:AbstractGeneralParameterValuePropertyType">
		<annotation>
			<documentation>gml:parameterValue is a composition association to a parameter value or group of parameter values used by a coordinate operation.</documentation>
		</annotation>
	</element>
	<complexType name="ConversionPropertyType">
		<annotation>
			<documentation>gml:ConversionPropertyType is a property type for association roles to a concrete general-purpose conversion, either referencing or containing the definition of that conversion.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:Conversion"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="Transformation" type="gml:TransformationType" substitutionGroup="gml:AbstractGeneralTransformation">
		<annotation>
			<documentation>gml:Transformation is a concrete object element derived from gml:GeneralTransformation (13.6.2.13).
This concrete object can be used for all operation methods, without using a GML Application Schema that defines operation-method-specialized element names and contents, especially for methods with only one Transformation instance.
The parameterValue elements are an unordered list of composition associations to the set of parameter values used by this conversion operation.</documentation>
		</annotation>
	</element>
	<complexType name="TransformationType">
		<complexContent>
			<extension base="gml:AbstractGeneralTransformationType">
				<sequence>
					<element ref="gml:method"/>
					<element ref="gml:parameterValue" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TransformationPropertyType">
		<annotation>
			<documentation>gml:TransformationPropertyType is a property type for association roles to a transformation, either referencing or containing the definition of that transformation.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:Transformation"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="AbstractGeneralParameterValue" type="gml:AbstractGeneralParameterValueType" abstract="true" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>gml:AbstractGeneralParameterValue is an abstract parameter value or group of parameter values.
This abstract complexType is expected to be extended and restricted for well-known operation methods with many instances, in Application Schemas that define operation-method-specialized element names and contents. Specific parameter value elements are directly contained in concrete subtypes, not in this abstract type. All concrete types derived from this type shall extend this type to include one "...Value" element with an appropriate type, which should be one of the element types allowed in the ParameterValueType. In addition, all derived concrete types shall extend this type to include a "operationParameter" property element that references one element substitutable for the "OperationParameter" object element.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractGeneralParameterValueType" abstract="true">
		<sequence/>
	</complexType>
	<complexType name="AbstractGeneralParameterValuePropertyType">
		<annotation>
			<documentation>gml:AbstractGeneralParameterValuePropertyType is a  property type for inline association roles to a parameter value or group of parameter values, always containing the values.</documentation>
		</annotation>
		<sequence>
			<element ref="gml:AbstractGeneralParameterValue"/>
		</sequence>
	</complexType>
	<element name="ParameterValue" type="gml:ParameterValueType" substitutionGroup="gml:AbstractGeneralParameterValue">
		<annotation>
			<documentation>gml:ParameterValue is a parameter value, an ordered sequence of values, or a reference to a file of parameter values. This concrete complex type may be used for operation methods without using an Application Schema that defines operation-method-specialized element names and contents, especially for methods with only one instance. This complex type may be used, extended, or restricted for well-known operation methods, especially for methods with many instances.</documentation>
		</annotation>
	</element>
	<complexType name="ParameterValueType">
		<complexContent>
			<extension base="gml:AbstractGeneralParameterValueType">
				<sequence>
					<choice>
						<element ref="gml:value"/>
						<element ref="gml:dmsAngleValue"/>
						<element ref="gml:stringValue"/>
						<element ref="gml:integerValue"/>
						<element ref="gml:booleanValue"/>
						<element ref="gml:valueList"/>
						<element ref="gml:integerValueList"/>
						<element ref="gml:valueFile"/>
					</choice>
					<element ref="gml:operationParameter"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="value" type="gml:MeasureType">
		<annotation>
			<documentation>gml:value is a numeric value of an operation parameter, with its associated unit of measure.</documentation>
		</annotation>
	</element>
	<element name="stringValue" type="string">
		<annotation>
			<documentation>gml:stringValue is a character string value of an operation parameter. A string value does not have an associated unit of measure.</documentation>
		</annotation>
	</element>
	<element name="integerValue" type="positiveInteger">
		<annotation>
			<documentation>gml:integerValue is a positive integer value of an operation parameter, usually used for a count. An integer value does not have an associated unit of measure.</documentation>
		</annotation>
	</element>
	<element name="booleanValue" type="boolean">
		<annotation>
			<documentation>gml:booleanValue is a boolean value of an operation parameter. A Boolean value does not have an associated unit of measure.</documentation>
		</annotation>
	</element>
	<element name="valueList" type="gml:MeasureListType">
		<annotation>
			<documentation>gml:valueList is an ordered sequence of two or more numeric values of an operation parameter list, where each value has the same associated unit of measure. An element of this type contains a space-separated sequence of double values.</documentation>
		</annotation>
	</element>
	<element name="integerValueList" type="gml:integerList">
		<annotation>
			<documentation>gml:integerValueList is an ordered sequence of two or more integer values of an operation parameter list, usually used for counts. These integer values do not have an associated unit of measure. An element of this type contains a space-separated sequence of integer values.</documentation>
		</annotation>
	</element>
	<element name="valueFile" type="anyURI">
		<annotation>
			<documentation>gml:valueFile is a reference to a file or a part of a file containing one or more parameter values, each numeric value with its associated unit of measure. When referencing a part of a file, that file shall contain multiple identified parts, such as an XML encoded document. Furthermore, the referenced file or part of a file may reference another part of the same or different files, as allowed in XML documents.</documentation>
		</annotation>
	</element>
	<element name="operationParameter" type="gml:OperationParameterPropertyType">
		<annotation>
			<documentation>gml:operationParameter is an association role to the operation parameter of which this is a value.</documentation>
		</annotation>
	</element>
	<element name="ParameterValueGroup" type="gml:ParameterValueGroupType" substitutionGroup="gml:AbstractGeneralParameterValue">
		<annotation>
			<documentation>gml:ParameterValueGroup is a group of related parameter values. The same group can be repeated more than once in a Conversion, Transformation, or higher level ParameterValueGroup, if those instances contain different values of one or more parameterValues which suitably distinquish among those groups. This concrete complex type can be used for operation methods without using an Application Schema that defines operation-method-specialized element names and contents. This complex type may be used, extended, or restricted for well-known operation methods, especially for methods with only one instance.
The parameterValue elements are an unordered set of composition association roles to the parameter values and groups of values included in this group.</documentation>
		</annotation>
	</element>
	<complexType name="ParameterValueGroupType">
		<complexContent>
			<extension base="gml:AbstractGeneralParameterValueType">
				<sequence>
					<element ref="gml:parameterValue" minOccurs="2" maxOccurs="unbounded"/>
					<element ref="gml:group"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="group" type="gml:OperationParameterGroupPropertyType">
		<annotation>
			<documentation>gml:group is an association role to the operation parameter group for which this element provides parameter values.</documentation>
		</annotation>
	</element>
	<element name="OperationMethod" type="gml:OperationMethodType" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>gml:OperationMethod is a method (algorithm or procedure) used to perform a coordinate operation. Most operation methods use a number of operation parameters, although some coordinate conversions use none. Each coordinate operation using the method assigns values to these parameters.
The parameter elements are an unordered list of associations to the set of operation parameters and parameter groups used by this operation method.</documentation>
		</annotation>
	</element>
	<complexType name="OperationMethodType">
		<complexContent>
			<extension base="gml:IdentifiedObjectType">
				<sequence>
					<choice>
						<element ref="gml:formulaCitation"/>
						<element ref="gml:formula"/>
					</choice>
					<element ref="gml:sourceDimensions" minOccurs="0"/>
					<element ref="gml:targetDimensions" minOccurs="0"/>
					<element ref="gml:parameter" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="formulaCitation">
		<annotation>
			<documentation>gml:formulaCitation provides a reference to a publication giving the formula(s) or procedure used by an coordinate operation method.</documentation>
		</annotation>
		<complexType>
			<sequence minOccurs="0">
				<element ref="gmd:CI_Citation"/>
			</sequence>
			<attributeGroup ref="gml:AssociationAttributeGroup"/>
		</complexType>
	</element>
	<element name="formula" type="gml:CodeType">
		<annotation>
			<documentation>gml:formula Formula(s) or procedure used by an operation method. The use of the codespace attribite has been deprecated. The property value shall be a character string.</documentation>
		</annotation>
	</element>
	<element name="sourceDimensions" type="positiveInteger">
		<annotation>
			<documentation>gml:sourceDimensions is the number of dimensions in the source CRS of this operation method.</documentation>
		</annotation>
	</element>
	<element name="targetDimensions" type="positiveInteger">
		<annotation>
			<documentation>gml:targetDimensions is the number of dimensions in the target CRS of this operation method.</documentation>
		</annotation>
	</element>
	<element name="parameter" type="gml:AbstractGeneralOperationParameterPropertyType">
		<annotation>
			<documentation>gml:parameter is an association to an operation parameter or parameter group.</documentation>
		</annotation>
	</element>
	<complexType name="OperationMethodPropertyType">
		<annotation>
			<documentation>gml:OperationMethodPropertyType is a property type for association roles to a concrete general-purpose operation method, either referencing or containing the definition of that method.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:OperationMethod"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="AbstractGeneralOperationParameter" type="gml:AbstractGeneralOperationParameterType" abstract="true" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>gml:GeneralOperationParameter is the abstract definition of a parameter or group of parameters used by an operation method.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractGeneralOperationParameterType" abstract="true">
		<complexContent>
			<extension base="gml:IdentifiedObjectType">
				<sequence>
					<element ref="gml:minimumOccurs" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="minimumOccurs" type="nonNegativeInteger">
		<annotation>
			<documentation>gml:minimumOccurs is the minimum number of times that values for this parameter group or parameter are required. If this attribute is omitted, the minimum number shall be one.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractGeneralOperationParameterPropertyType">
		<annotation>
			<documentation>gml:AbstractGeneralOperationParameterPropertyType is a property type for association roles to an operation parameter or group, either referencing or containing the definition of that parameter or group.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractGeneralOperationParameter"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="OperationParameter" type="gml:OperationParameterType" substitutionGroup="gml:AbstractGeneralOperationParameter">
		<annotation>
			<documentation>gml:OperationParameter is the definition of a parameter used by an operation method. Most parameter values are numeric, but other types of parameter values are possible. This complex type is expected to be used or extended for all operation methods, without defining operation-method-specialized element names.</documentation>
		</annotation>
	</element>
	<complexType name="OperationParameterType">
		<complexContent>
			<extension base="gml:AbstractGeneralOperationParameterType">
				<sequence/>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="OperationParameterPropertyType">
		<annotation>
			<documentation>gml:OperationParameterPropertyType is a property type for association roles to an operation parameter, either referencing or containing the definition of that parameter.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:OperationParameter"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="OperationParameterGroup" type="gml:OperationParameterGroupType" substitutionGroup="gml:AbstractGeneralOperationParameter">
		<annotation>
			<documentation>gml:OperationParameterGroup is the definition of a group of parameters used by an operation method. This complex type is expected to be used or extended for all applicable operation methods, without defining operation-method-specialized element names.
The generalOperationParameter elements are an unordered list of associations to the set of operation parameters that are members of this group.</documentation>
		</annotation>
	</element>
	<complexType name="OperationParameterGroupType">
		<complexContent>
			<extension base="gml:AbstractGeneralOperationParameterType">
				<sequence>
					<element ref="gml:maximumOccurs" minOccurs="0"/>
					<element ref="gml:parameter" minOccurs="2" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="maximumOccurs" type="positiveInteger">
		<annotation>
			<documentation>gml:maximumOccurs is the maximum number of times that values for this parameter group may be included. If this attribute is omitted, the maximum number shall be one.</documentation>
		</annotation>
	</element>
	<complexType name="OperationParameterGroupPropertyType">
		<annotation>
			<documentation>gml:OperationParameterPropertyType is a property type for association roles to an operation parameter group, either referencing or containing the definition of that parameter group.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:OperationParameterGroup"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/temporalTopology.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:temporalTopology:3.2.2">temporalTopology.xsd</appinfo>
		<documentation>See ISO/DIS 19136 15.3.
Temporal topology is described in terms of time complexes, nodes, and edges, and the connectivity between these. Temporal topology does not directly provide information about temporal position. It is used in the case of describing a lineage or a history (e.g. a family tree expressing evolution of species, an ecological cycle, a lineage of lands or buildings, or a history of separation and merger of administrative boundaries). The following Subclauses specifies the temporal topology as temporal characteristics of features in compliance with ISO 19108.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="temporal.xsd"/>
	<element name="AbstractTimeTopologyPrimitive" type="gml:AbstractTimeTopologyPrimitiveType" abstract="true" substitutionGroup="gml:AbstractTimePrimitive">
		<annotation>
			<documentation>gml:TimeTopologyPrimitive acts as the head of a substitution group for topological temporal primitives.
Temporal topology primitives shall imply the ordering information between features or feature properties. The temporal connection of features can be examined if they have temporal topology primitives as values of their properties. Usually, an instantaneous feature associates with a time node, and a static feature associates with a time edge.  A feature with both modes associates with the temporal topology primitive: a supertype of time nodes and time edges.
A topological primitive is always connected to one or more other topological primitives, and is, therefore, always a member of a topological complex. In a GML instance, this will often be indicated by the primitives being described by elements that are descendents of an element describing a complex. However, in order to support the case where a temporal topological primitive is described in another context, the optional complex property is provided, which carries a reference to the parent temporal topological complex.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractTimeTopologyPrimitiveType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractTimePrimitiveType">
				<sequence>
					<element name="complex" type="gml:ReferenceType" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimeTopologyPrimitivePropertyType">
		<annotation>
			<documentation>gml:TimeTopologyPrimitivePropertyType provides for associating a gml:AbstractTimeTopologyPrimitive with an object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractTimeTopologyPrimitive"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="TimeTopologyComplex" type="gml:TimeTopologyComplexType" substitutionGroup="gml:AbstractTimeComplex">
		<annotation>
			<documentation>A temporal topology complex shall be the connected acyclic directed graph composed of temporal topological primitives, i.e. time nodes and time edges. Because a time edge may not exist without two time nodes on its boundaries, static features have time edges from a temporal topology complex as the values of their temporal properties, regardless of explicit declarations.
A temporal topology complex expresses a linear or a non-linear graph. A temporal linear graph, composed of a sequence of time edges, provides a lineage described only by "substitution" of feature instances or feature element values. A time node as the start or the end of the graph connects with at least one time edge. A time node other than the start and the end shall connect to at least two time edges: one of starting from the node, and another ending at the node.
A temporal topological complex is a set of connected temporal topological primitives. The member primtives are indicated, either by reference or by value, using the primitive property.</documentation>
		</annotation>
	</element>
	<complexType name="TimeTopologyComplexType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractTimeComplexType">
				<sequence>
					<element name="primitive" type="gml:TimeTopologyPrimitivePropertyType" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimeTopologyComplexPropertyType">
		<annotation>
			<documentation>gml:TimeTopologyComplexPropertyType provides for associating a gml:TimeTopologyComplex with an object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimeTopologyComplex"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="TimeNode" type="gml:TimeNodeType" substitutionGroup="gml:AbstractTimeTopologyPrimitive">
		<annotation>
			<documentation>A time node is a zero-dimensional topological primitive that represents an identifiable node in time (it is equivalent to a point in space). A node may act as the termination or initiation of any number of time edges. A time node may be realised as a geometry, its position, whose value is a time instant.</documentation>
		</annotation>
	</element>
	<complexType name="TimeNodeType">
		<complexContent>
			<extension base="gml:AbstractTimeTopologyPrimitiveType">
				<sequence>
					<element name="previousEdge" type="gml:TimeEdgePropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<element name="nextEdge" type="gml:TimeEdgePropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<element name="position" type="gml:TimeInstantPropertyType" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimeNodePropertyType">
		<annotation>
			<documentation>gml:TimeNodePropertyType provides for associating a gml:TimeNode with an object</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimeNode"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="TimeEdge" type="gml:TimeEdgeType" substitutionGroup="gml:AbstractTimeTopologyPrimitive">
		<annotation>
			<documentation>A time edge is a one-dimensional topological primitive. It is an open interval that starts and ends at a node. The edge may be realised as a geometry whose value is a time period.</documentation>
		</annotation>
	</element>
	<complexType name="TimeEdgeType">
		<complexContent>
			<extension base="gml:AbstractTimeTopologyPrimitiveType">
				<sequence>
					<element name="start" type="gml:TimeNodePropertyType"/>
					<element name="end" type="gml:TimeNodePropertyType"/>
					<element name="extent" type="gml:TimePeriodPropertyType" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimeEdgePropertyType">
		<annotation>
			<documentation>gml:TimeEdgePropertyType provides for associating a gml:TimeEdge with an object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimeEdge"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/dictionary.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:opengis:specification:gml:schema-xsd:dictionary:v3.2.1">dictionary.xsd</appinfo>
		<documentation>See ISO/DIS 19136 Clause 16.
Many applications require definitions of terms which are used within instance documents as the values of certain properties or as reference information to tie properties to standard information values in some way.  Units of measure and descriptions of measurable phenomena are two particular examples. 
It will often be convenient to use definitions provided by external authorities. These may already be packaged for delivery in various ways, both online and offline. In order that they may be referred to from GML documents it is generally necessary that a URI be available for each definition. Where this is the case then it is usually preferable to refer to these directly. 
Alternatively, it may be convenient or necessary to capture definitions in XML, either embedded within an instance document containing features or as a separate document. The definitions may be transcriptions from an external source, or may be new definitions for a local purpose. In order to support this case, some simple components are provided in GML in the form of 
-	a generic gml:Definition, which may serve as the basis for more specialized definitions
-	a generic gml:Dictionary, which allows a set of definitions or references to definitions to be collected 
These components may be used directly, but also serve as the basis for more specialised definition elements in GML, in particular: coordinate operations, coordinate reference systems, datums, temporal reference systems, and units of measure.  
Note that the GML definition and dictionary components implement a simple nested hierarchy of definitions with identifiers. The latter provide handles which may be used in the description of more complex relationships between terms. However, the GML dictionary components are not intended to provide direct support for complex taxonomies, ontologies or thesauri.  Specialised XML tools are available to satisfy the more sophisticated requirements.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="gmlBase.xsd"/>
	<element name="Definition" type="gml:DefinitionType" substitutionGroup="gml:AbstractGML">
		<annotation>
			<documentation>The basic gml:Definition element specifies a definition, which can be included in or referenced by a dictionary. 
The content model for a generic definition is a derivation from gml:AbstractGMLType.  
The gml:description property element shall hold the definition if this can be captured in a simple text string, or the gml:descriptionReference property element may carry a link to a description elsewhere.
The gml:identifier element shall provide one identifier identifying this definition. The identifier shall be unique within the dictionaries using this definition. 
The gml:name elements shall provide zero or more terms and synonyms for which this is the definition.
The gml:remarks element shall be used to hold additional textual information that is not conceptually part of the definition but is useful in understanding the definition.</documentation>
		</annotation>
	</element>
	<complexType name="DefinitionBaseType">
		<complexContent>
			<restriction base="gml:AbstractGMLType">
				<sequence>
					<element ref="gml:metaDataProperty" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:description" minOccurs="0"/>
					<element ref="gml:descriptionReference" minOccurs="0"/>
					<element ref="gml:identifier"/>
					<element ref="gml:name" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
				<attribute ref="gml:id" use="required"/>
			</restriction>
		</complexContent>
	</complexType>
	<complexType name="DefinitionType">
		<complexContent>
			<extension base="gml:DefinitionBaseType">
				<sequence>
					<element ref="gml:remarks" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="remarks" type="string"/>
	<element name="Dictionary" type="gml:DictionaryType" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>Sets of definitions may be collected into dictionaries or collections.
A gml:Dictionary is a non-abstract collection of definitions.
The gml:Dictionary content model adds a list of gml:dictionaryEntry properties that contain or reference gml:Definition objects.  A database handle (gml:id attribute) is required, in order that this collection may be referred to. The standard gml:identifier, gml:description, gml:descriptionReference and gml:name properties are available to reference or contain more information about this dictionary. The gml:description and gml:descriptionReference property elements may be used for a description of this dictionary. The derived gml:name element may be used for the name(s) of this dictionary. for remote definiton references gml:dictionaryEntry shall be used. If a Definition object contained within a Dictionary uses the descriptionReference property to refer to a remote definition, then this enables the inclusion of a remote definition in a local dictionary, giving a handle and identifier in the context of the local dictionary.</documentation>
		</annotation>
	</element>
	<complexType name="DictionaryType">
		<complexContent>
			<extension base="gml:DefinitionType">
				<choice minOccurs="0" maxOccurs="unbounded">
					<element ref="gml:dictionaryEntry"/>
					<element ref="gml:indirectEntry"/>
				</choice>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="dictionaryEntry" type="gml:DictionaryEntryType">
		<annotation>
			<documentation>This property element contains or refers to the definitions which are members of a dictionary. 
The content model follows the standard GML property pattern, so a gml:dictionaryEntry may either contain or refer to a single gml:Definition. Since gml:Dictionary is substitutable for gml:Definition, the content of an entry may itself be a lower level dictionary. 
Note that if the value is provided by reference, this definition does not carry a handle (gml:id) in this context, so does not allow external references to this specific definition in this context.  When used in this way the referenced definition will usually be in a dictionary in the same XML document.</documentation>
		</annotation>
	</element>
	<complexType name="DictionaryEntryType">
		<complexContent>
			<extension base="gml:AbstractMemberType">
				<sequence minOccurs="0">
					<element ref="gml:Definition"/>
				</sequence>
				<attributeGroup ref="gml:AssociationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
</schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gco/basicTypes.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gco="http://www.isotc211.org/2005/gco" targetNamespace="http://www.isotc211.org/2005/gco" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic COmmon (GCO) extensible markup language is a component of the XML Schema Implementation of Geographic
Information Metadata documented in ISO/TS 19139:2007. GCO includes all the definitions of http://www.isotc211.org/2005/gco namespace. The root document of this namespace is the file gco.xsd. This basicTypes.xsd schema implements concepts from the "basic types" package of ISO/TS 19103.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.opengis.net/gml/3.2" schemaLocation="http://schemas.opengis.net/gml/3.2.1/gml.xsd"/>
	<xs:import namespace="http://www.w3.org/1999/xlink" schemaLocation="http://www.w3.org/1999/xlink.xsd"/>
	<xs:include schemaLocation="gco.xsd"/>
	<xs:include schemaLocation="gcoBase.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<!-- =========================================================================== -->
	<xs:complexType name="TypeName_Type">
		<xs:annotation>
			<xs:documentation>A TypeName is a LocalName that references either a recordType or object type in some form of schema. The stored value "aName" is the returned value for the "aName()" operation. This is the types name.  - For parsing from types (or objects) the parsible name normally uses a "." navigation separator, so that it is of the form  [class].[member].[memberOfMember]. ...)</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="aName" type="gco:CharacterString_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="TypeName" type="gco:TypeName_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="TypeName_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:TypeName"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MemberName_Type">
		<xs:annotation>
			<xs:documentation>A MemberName is a LocalName that references either an attribute slot in a record or  recordType or an attribute, operation, or association role in an object instance or  type description in some form of schema. The stored value "aName" is the returned value for the "aName()" operation.</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="aName" type="gco:CharacterString_PropertyType"/>
					<xs:element name="attributeType" type="gco:TypeName_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MemberName" type="gco:MemberName_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MemberName_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:MemberName"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="Multiplicity_Type">
		<xs:annotation>
			<xs:documentation>Use to represent the possible cardinality of a relation. Represented by a set of simple multiplicity ranges.</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="range" type="gco:MultiplicityRange_PropertyType" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="Multiplicity" type="gco:Multiplicity_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Multiplicity_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Multiplicity"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MultiplicityRange_Type">
		<xs:annotation>
			<xs:documentation>A component of a multiplicity, consisting of an non-negative lower bound, and a potentially infinite upper bound.</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="lower" type="gco:Integer_PropertyType"/>
					<xs:element name="upper" type="gco:UnlimitedInteger_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MultiplicityRange" type="gco:MultiplicityRange_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MultiplicityRange_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:MultiplicityRange"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!--================================================-->
	<!-- ================== Measure ===================== -->
	<!-- ........................................................................ -->
	<xs:element name="Measure" type="gml:MeasureType"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Measure_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Measure"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="Length" type="gml:LengthType" substitutionGroup="gco:Measure"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Length_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Length"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="Angle" type="gml:AngleType" substitutionGroup="gco:Measure"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Angle_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Angle"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="Scale" type="gml:ScaleType" substitutionGroup="gco:Measure"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Scale_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Scale"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="Distance" type="gml:LengthType" substitutionGroup="gco:Length"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Distance_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Distance"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="CharacterString" type="xs:string"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CharacterString_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:CharacterString"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="Boolean" type="xs:boolean"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Boolean_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Boolean"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="AbstractGenericName" type="gml:CodeType" abstract="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="GenericName_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:AbstractGenericName"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="LocalName" type="gml:CodeType" substitutionGroup="gco:AbstractGenericName"/>
	<!-- ........................................................................ -->
	<xs:complexType name="LocalName_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:LocalName"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="ScopedName" type="gml:CodeType" substitutionGroup="gco:AbstractGenericName"/>
	<!-- ........................................................................ -->
	<xs:complexType name="ScopedName_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:ScopedName"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ============================= UOM ========================================= -->
	<!-- ........................................................................ -->
	<!-- ........................................................................ -->
	<xs:complexType name="UomAngle_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:UnitDefinition"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<!-- ........................................................................ -->
	<xs:complexType name="UomLength_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:UnitDefinition"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<!-- ........................................................................ -->
	<xs:complexType name="UomScale_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:UnitDefinition"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<!-- ........................................................................ -->
	<xs:complexType name="UnitOfMeasure_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:UnitDefinition"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<!-- ........................................................................ -->
	<xs:complexType name="UomArea_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:UnitDefinition"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<!-- ........................................................................ -->
	<xs:complexType name="UomVelocity_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:UnitDefinition"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<!-- ........................................................................ -->
	<xs:complexType name="UomTime_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:UnitDefinition"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<!-- ........................................................................ -->
	<xs:complexType name="UomVolume_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:UnitDefinition"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- ========================================================================== -->
	<!-- =========================== Date & DateTime ================================= -->
	<!--=============================================-->
	<xs:element name="DateTime" type="xs:dateTime"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DateTime_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:DateTime"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:simpleType name="Date_Type">
		<xs:union memberTypes="xs:date xs:gYearMonth xs:gYear"/>
	</xs:simpleType>
	<!-- ........................................................................ -->
	<xs:element name="Date" type="gco:Date_Type" nillable="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Date_PropertyType">
		<xs:choice minOccurs="0">
			<xs:element ref="gco:Date"/>
			<xs:element ref="gco:DateTime"/>
		</xs:choice>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- ========================================================================== -->
	<!-- =========================== Number basic type =============================== -->
	<!--=======================================================-->
	<xs:complexType name="Number_PropertyType">
		<xs:choice minOccurs="0">
			<xs:element ref="gco:Real"/>
			<xs:element ref="gco:Decimal"/>
			<xs:element ref="gco:Integer"/>
		</xs:choice>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="Decimal" type="xs:decimal"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Decimal_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Decimal"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="Real" type="xs:double"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Real_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Real"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="Integer" type="xs:integer"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Integer_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Integer"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- ========================================================================== -->
	<!-- ============================= UnlimitedInteger ================================ -->
	<!--NB: The encoding mechanism below is based on the use of XCPT (see the usage of xsi:nil in XML instance).-->
	<!--================= Type ==================-->
	<xs:complexType name="UnlimitedInteger_Type">
		<xs:simpleContent>
			<xs:extension base="xs:nonNegativeInteger">
				<xs:attribute name="isInfinite" type="xs:boolean"/>
			</xs:extension>
		</xs:simpleContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="UnlimitedInteger" type="gco:UnlimitedInteger_Type" nillable="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="UnlimitedInteger_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:UnlimitedInteger"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- ========================================================================== -->
	<!-- ========================= Record & RecordType ============================== -->
	<!--================= Record ==================-->
	<xs:element name="Record"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Record_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Record"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!--================= RecordType ==================-->
	<xs:complexType name="RecordType_Type">
		<xs:simpleContent>
			<xs:extension base="xs:string">
				<xs:attributeGroup ref="xlink:simpleAttrs"/>
			</xs:extension>
		</xs:simpleContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="RecordType" type="gco:RecordType_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="RecordType_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:RecordType"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- ========================================================================== -->
	<!-- =========================== Binary basic type ================================ -->
	<!--NB: this type is not declared in 19103 but used in 19115. -->
	<!--================= Type ==================-->
	<xs:complexType name="Binary_Type">
		<xs:simpleContent>
			<xs:extension base="xs:string">
				<xs:attribute name="src" type="xs:anyURI"/>
			</xs:extension>
		</xs:simpleContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="Binary" type="gco:Binary_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Binary_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gco:Binary"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!--================================================-->
	<!-- =============================================== -->
	<!--================================================-->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/spatialRepresentation.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gss="http://www.isotc211.org/2005/gss" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This portrayalCatalogue.xsd schema implements the UML conceptual schema defined in A.2.6 of ISO 19115:2003. It contains the implementation of the following classes: MD_GridSpatialRepresentation, MD_VectorSpatialRepresentation, MD_SpatialRepresentation, MD_Georeferenceable, MD_Dimension, MD_Georectified, MD_GeometricObjects, MD_TopologyLevelCode, MD_GeometricObjectTypeCode, MD_CellGeometryCode, MD_DimensionNameTypeCode, MD_PixelOrientationCode.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gss" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gss/gss.xsd"/>
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="citation.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="MD_GridSpatialRepresentation_Type">
		<xs:annotation>
			<xs:documentation>Types and numbers of raster spatial objects in the dataset</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:AbstractMD_SpatialRepresentation_Type">
				<xs:sequence>
					<xs:element name="numberOfDimensions" type="gco:Integer_PropertyType"/>
					<xs:element name="axisDimensionProperties" type="gmd:MD_Dimension_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="cellGeometry" type="gmd:MD_CellGeometryCode_PropertyType"/>
					<xs:element name="transformationParameterAvailability" type="gco:Boolean_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_GridSpatialRepresentation" type="gmd:MD_GridSpatialRepresentation_Type" substitutionGroup="gmd:AbstractMD_SpatialRepresentation"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_GridSpatialRepresentation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_GridSpatialRepresentation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_VectorSpatialRepresentation_Type">
		<xs:annotation>
			<xs:documentation>Information about the vector spatial objects in the dataset</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:AbstractMD_SpatialRepresentation_Type">
				<xs:sequence>
					<xs:element name="topologyLevel" type="gmd:MD_TopologyLevelCode_PropertyType" minOccurs="0"/>
					<xs:element name="geometricObjects" type="gmd:MD_GeometricObjects_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_VectorSpatialRepresentation" type="gmd:MD_VectorSpatialRepresentation_Type" substitutionGroup="gmd:AbstractMD_SpatialRepresentation"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_VectorSpatialRepresentation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_VectorSpatialRepresentation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractMD_SpatialRepresentation_Type" abstract="true">
		<xs:annotation>
			<xs:documentation>Digital mechanism used to represent spatial information</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence/>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractMD_SpatialRepresentation" type="gmd:AbstractMD_SpatialRepresentation_Type" abstract="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_SpatialRepresentation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractMD_SpatialRepresentation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Georeferenceable_Type">
		<xs:complexContent>
			<xs:extension base="gmd:MD_GridSpatialRepresentation_Type">
				<xs:sequence>
					<xs:element name="controlPointAvailability" type="gco:Boolean_PropertyType"/>
					<xs:element name="orientationParameterAvailability" type="gco:Boolean_PropertyType"/>
					<xs:element name="orientationParameterDescription" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="georeferencedParameters" type="gco:Record_PropertyType"/>
					<xs:element name="parameterCitation" type="gmd:CI_Citation_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Georeferenceable" type="gmd:MD_Georeferenceable_Type" substitutionGroup="gmd:MD_GridSpatialRepresentation"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Georeferenceable_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Georeferenceable"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Dimension_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="dimensionName" type="gmd:MD_DimensionNameTypeCode_PropertyType"/>
					<xs:element name="dimensionSize" type="gco:Integer_PropertyType"/>
					<xs:element name="resolution" type="gco:Measure_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Dimension" type="gmd:MD_Dimension_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Dimension_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Dimension"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Georectified_Type">
		<xs:complexContent>
			<xs:extension base="gmd:MD_GridSpatialRepresentation_Type">
				<xs:sequence>
					<xs:element name="checkPointAvailability" type="gco:Boolean_PropertyType"/>
					<xs:element name="checkPointDescription" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="cornerPoints" type="gss:GM_Point_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="centerPoint" type="gss:GM_Point_PropertyType" minOccurs="0"/>
					<xs:element name="pointInPixel" type="gmd:MD_PixelOrientationCode_PropertyType"/>
					<xs:element name="transformationDimensionDescription" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="transformationDimensionMapping" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="2"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Georectified" type="gmd:MD_Georectified_Type" substitutionGroup="gmd:MD_GridSpatialRepresentation"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Georectified_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Georectified"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_GeometricObjects_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="geometricObjectType" type="gmd:MD_GeometricObjectTypeCode_PropertyType"/>
					<xs:element name="geometricObjectCount" type="gco:Integer_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_GeometricObjects" type="gmd:MD_GeometricObjects_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_GeometricObjects_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_GeometricObjects"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:simpleType name="MD_PixelOrientationCode_Type">
		<xs:restriction base="xs:string">
			<xs:enumeration value="center"/>
			<xs:enumeration value="lowerLeft"/>
			<xs:enumeration value="lowerRight"/>
			<xs:enumeration value="upperRight"/>
			<xs:enumeration value="upperLeft"/>
		</xs:restriction>
	</xs:simpleType>
	<!-- ........................................................................ -->
	<xs:element name="MD_PixelOrientationCode" type="gmd:MD_PixelOrientationCode_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_PixelOrientationCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_PixelOrientationCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_TopologyLevelCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_TopologyLevelCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_TopologyLevelCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_GeometricObjectTypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_GeometricObjectTypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_GeometricObjectTypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_CellGeometryCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_CellGeometryCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_CellGeometryCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_DimensionNameTypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_DimensionNameTypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_DimensionNameTypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/metadataExtension.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This metadataExtension.xsd schema implements the UML conceptual schema defined in A.2.11 of ISO 19115:2003. It contains the implementation of the following classes: MD_ExtendedElementInformation, MD_MetadataExtensionInformation, MD_ObligationCode, MD_DatatypeCode.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="citation.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="MD_ExtendedElementInformation_Type">
		<xs:annotation>
			<xs:documentation>New metadata element, not found in ISO 19115, which is required to describe geographic data</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="name" type="gco:CharacterString_PropertyType"/>
					<xs:element name="shortName" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="domainCode" type="gco:Integer_PropertyType" minOccurs="0"/>
					<xs:element name="definition" type="gco:CharacterString_PropertyType"/>
					<xs:element name="obligation" type="gmd:MD_ObligationCode_PropertyType" minOccurs="0"/>
					<xs:element name="condition" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="dataType" type="gmd:MD_DatatypeCode_PropertyType"/>
					<xs:element name="maximumOccurrence" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="domainValue" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="parentEntity" type="gco:CharacterString_PropertyType" maxOccurs="unbounded"/>
					<xs:element name="rule" type="gco:CharacterString_PropertyType"/>
					<xs:element name="rationale" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="source" type="gmd:CI_ResponsibleParty_PropertyType" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_ExtendedElementInformation" type="gmd:MD_ExtendedElementInformation_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ExtendedElementInformation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ExtendedElementInformation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_MetadataExtensionInformation_Type">
		<xs:annotation>
			<xs:documentation>Information describing metadata extensions.</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="extensionOnLineResource" type="gmd:CI_OnlineResource_PropertyType" minOccurs="0"/>
					<xs:element name="extendedElementInformation" type="gmd:MD_ExtendedElementInformation_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_MetadataExtensionInformation" type="gmd:MD_MetadataExtensionInformation_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_MetadataExtensionInformation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_MetadataExtensionInformation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:simpleType name="MD_ObligationCode_Type">
		<xs:restriction base="xs:string">
			<xs:enumeration value="mandatory"/>
			<xs:enumeration value="optional"/>
			<xs:enumeration value="conditional"/>
		</xs:restriction>
	</xs:simpleType>
	<!-- ........................................................................ -->
	<xs:element name="MD_ObligationCode" type="gmd:MD_ObligationCode_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ObligationCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ObligationCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_DatatypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_DatatypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_DatatypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/content.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This content.xsd schema implements the UML conceptual schema defined in ISO 19115:2003, A.2.8. It contains the implementation of the following classes: MD_FeatureCatalogueDescription, MD_CoverageDescription,
MD_ImageDescription, MD_ContentInformation, MD_RangeDimension, MD_Band, MD_CoverageContentTypeCode, MD_ImagingConditionCode.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="citation.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="MD_FeatureCatalogueDescription_Type">
		<xs:annotation>
			<xs:documentation>Information identifing the feature catalogue</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:AbstractMD_ContentInformation_Type">
				<xs:sequence>
					<xs:element name="complianceCode" type="gco:Boolean_PropertyType" minOccurs="0"/>
					<xs:element name="language" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="includedWithDataset" type="gco:Boolean_PropertyType"/>
					<xs:element name="featureTypes" type="gco:GenericName_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="featureCatalogueCitation" type="gmd:CI_Citation_PropertyType" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_FeatureCatalogueDescription" type="gmd:MD_FeatureCatalogueDescription_Type" substitutionGroup="gmd:AbstractMD_ContentInformation"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_FeatureCatalogueDescription_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_FeatureCatalogueDescription"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_CoverageDescription_Type">
		<xs:annotation>
			<xs:documentation>Information about the domain of the raster cell</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:AbstractMD_ContentInformation_Type">
				<xs:sequence>
					<xs:element name="attributeDescription" type="gco:RecordType_PropertyType"/>
					<xs:element name="contentType" type="gmd:MD_CoverageContentTypeCode_PropertyType"/>
					<xs:element name="dimension" type="gmd:MD_RangeDimension_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_CoverageDescription" type="gmd:MD_CoverageDescription_Type" substitutionGroup="gmd:AbstractMD_ContentInformation"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_CoverageDescription_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_CoverageDescription"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_ImageDescription_Type">
		<xs:annotation>
			<xs:documentation>Information about an image's suitability for use</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:MD_CoverageDescription_Type">
				<xs:sequence>
					<xs:element name="illuminationElevationAngle" type="gco:Real_PropertyType" minOccurs="0"/>
					<xs:element name="illuminationAzimuthAngle" type="gco:Real_PropertyType" minOccurs="0"/>
					<xs:element name="imagingCondition" type="gmd:MD_ImagingConditionCode_PropertyType" minOccurs="0"/>
					<xs:element name="imageQualityCode" type="gmd:MD_Identifier_PropertyType" minOccurs="0"/>
					<xs:element name="cloudCoverPercentage" type="gco:Real_PropertyType" minOccurs="0"/>
					<xs:element name="processingLevelCode" type="gmd:MD_Identifier_PropertyType" minOccurs="0"/>
					<xs:element name="compressionGenerationQuantity" type="gco:Integer_PropertyType" minOccurs="0"/>
					<xs:element name="triangulationIndicator" type="gco:Boolean_PropertyType" minOccurs="0"/>
					<xs:element name="radiometricCalibrationDataAvailability" type="gco:Boolean_PropertyType" minOccurs="0"/>
					<xs:element name="cameraCalibrationInformationAvailability" type="gco:Boolean_PropertyType" minOccurs="0"/>
					<xs:element name="filmDistortionInformationAvailability" type="gco:Boolean_PropertyType" minOccurs="0"/>
					<xs:element name="lensDistortionInformationAvailability" type="gco:Boolean_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_ImageDescription" type="gmd:MD_ImageDescription_Type" substitutionGroup="gmd:MD_CoverageDescription"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ImageDescription_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ImageDescription"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractMD_ContentInformation_Type" abstract="true">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence/>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractMD_ContentInformation" type="gmd:AbstractMD_ContentInformation_Type" abstract="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ContentInformation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractMD_ContentInformation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_RangeDimension_Type">
		<xs:annotation>
			<xs:documentation>Set of adjacent wavelengths in the electro-magnetic spectrum with a common characteristic, such as the visible band</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="sequenceIdentifier" type="gco:MemberName_PropertyType" minOccurs="0"/>
					<xs:element name="descriptor" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_RangeDimension" type="gmd:MD_RangeDimension_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_RangeDimension_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_RangeDimension"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Band_Type">
		<xs:complexContent>
			<xs:extension base="gmd:MD_RangeDimension_Type">
				<xs:sequence>
					<xs:element name="maxValue" type="gco:Real_PropertyType" minOccurs="0"/>
					<xs:element name="minValue" type="gco:Real_PropertyType" minOccurs="0"/>
					<xs:element name="units" type="gco:UomLength_PropertyType" minOccurs="0"/>
					<xs:element name="peakResponse" type="gco:Real_PropertyType" minOccurs="0"/>
					<xs:element name="bitsPerValue" type="gco:Integer_PropertyType" minOccurs="0"/>
					<xs:element name="toneGradation" type="gco:Integer_PropertyType" minOccurs="0"/>
					<xs:element name="scaleFactor" type="gco:Real_PropertyType" minOccurs="0"/>
					<xs:element name="offset" type="gco:Real_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Band" type="gmd:MD_Band_Type" substitutionGroup="gmd:MD_RangeDimension"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Band_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Band"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_CoverageContentTypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_CoverageContentTypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_CoverageContentTypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_ImagingConditionCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ImagingConditionCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ImagingConditionCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/applicationSchema.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This applicationSchema.xsd schema implements the UML conceptual schema defined in A.2.12 of ISO 19115:2003. It contains the implementation of the class MD_ApplicationSchemaInformation.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="citation.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="MD_ApplicationSchemaInformation_Type">
		<xs:annotation>
			<xs:documentation>Information about the application schema used to build the dataset</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="name" type="gmd:CI_Citation_PropertyType"/>
					<xs:element name="schemaLanguage" type="gco:CharacterString_PropertyType"/>
					<xs:element name="constraintLanguage" type="gco:CharacterString_PropertyType"/>
					<xs:element name="schemaAscii" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="graphicsFile" type="gco:Binary_PropertyType" minOccurs="0"/>
					<xs:element name="softwareDevelopmentFile" type="gco:Binary_PropertyType" minOccurs="0"/>
					<xs:element name="softwareDevelopmentFileFormat" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_ApplicationSchemaInformation" type="gmd:MD_ApplicationSchemaInformation_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ApplicationSchemaInformation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ApplicationSchemaInformation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/portrayalCatalogue.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This portrayalCatalogue.xsd schema implements the UML conceptual schema defined in A.2.9 of ISO 19115:2003. It contains the implementation of the class MD_PortrayalCatalogueReference.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="citation.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="MD_PortrayalCatalogueReference_Type">
		<xs:annotation>
			<xs:documentation>Information identifing the portrayal catalogue used</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="portrayalCatalogueCitation" type="gmd:CI_Citation_PropertyType" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_PortrayalCatalogueReference" type="gmd:MD_PortrayalCatalogueReference_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_PortrayalCatalogueReference_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_PortrayalCatalogueReference"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/dataQuality.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This dataQuality.xsd schema implements the UML conceptual schema defined in A.2.4 of ISO 19115:2003. It contains the implementation of the following classes: LI_ProcessStep, LI_Source, LI_Lineage,
DQ_ConformanceResult, DQ_QuantitativeResult, DQ_Result, DQ_TemporalValidity, DQ_AccuracyOfATimeMeasurement, DQ_QuantitativeAttributeAccuracy, DQ_NonQuantitativeAttributeAccuracy, DQ_ThematicClassificationCorrectness, DQ_RelativeInternalPositionalAccuracy, DQ_GriddedDataPositionalAccuracy, DQ_AbsoluteExternalPositionalAccuracy, DQ_TopologicalConsistency, DQ_FormatConsistency, DQ_DomainConsistency, DQ_ConceptualConsistency, DQ_CompletenessOmission, DQ_CompletenessCommission, DQ_TemporalAccuracy, DQ_ThematicAccuracy, DQ_PositionalAccuracy, DQ_LogicalConsistency, DQ_Completeness, DQ_Element, DQ_DataQuality.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="identification.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="LI_ProcessStep_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="description" type="gco:CharacterString_PropertyType"/>
					<xs:element name="rationale" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="dateTime" type="gco:DateTime_PropertyType" minOccurs="0"/>
					<xs:element name="processor" type="gmd:CI_ResponsibleParty_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="source" type="gmd:LI_Source_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="LI_ProcessStep" type="gmd:LI_ProcessStep_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="LI_ProcessStep_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:LI_ProcessStep"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="LI_Source_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="description" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="scaleDenominator" type="gmd:MD_RepresentativeFraction_PropertyType" minOccurs="0"/>
					<xs:element name="sourceReferenceSystem" type="gmd:MD_ReferenceSystem_PropertyType" minOccurs="0"/>
					<xs:element name="sourceCitation" type="gmd:CI_Citation_PropertyType" minOccurs="0"/>
					<xs:element name="sourceExtent" type="gmd:EX_Extent_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="sourceStep" type="gmd:LI_ProcessStep_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="LI_Source" type="gmd:LI_Source_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="LI_Source_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:LI_Source"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="LI_Lineage_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="statement" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="processStep" type="gmd:LI_ProcessStep_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="source" type="gmd:LI_Source_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="LI_Lineage" type="gmd:LI_Lineage_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="LI_Lineage_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:LI_Lineage"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_ConformanceResult_Type">
		<xs:annotation>
			<xs:documentation>quantitative_result from Quality Procedures -  - renamed to remove implied use limitiation.</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_Result_Type">
				<xs:sequence>
					<xs:element name="specification" type="gmd:CI_Citation_PropertyType"/>
					<xs:element name="explanation" type="gco:CharacterString_PropertyType"/>
					<xs:element name="pass" type="gco:Boolean_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_ConformanceResult" type="gmd:DQ_ConformanceResult_Type" substitutionGroup="gmd:AbstractDQ_Result"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_ConformanceResult_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_ConformanceResult"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_QuantitativeResult_Type">
		<xs:annotation>
			<xs:documentation>Quantitative_conformance_measure from Quality Procedures.  -  - Renamed to remove implied use limitation -  - OCL - -- result is type specified by valueDomain - result.tupleType = valueDomain</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_Result_Type">
				<xs:sequence>
					<xs:element name="valueType" type="gco:RecordType_PropertyType" minOccurs="0"/>
					<xs:element name="valueUnit" type="gco:UnitOfMeasure_PropertyType"/>
					<xs:element name="errorStatistic" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="value" type="gco:Record_PropertyType" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_QuantitativeResult" type="gmd:DQ_QuantitativeResult_Type" substitutionGroup="gmd:AbstractDQ_Result"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_QuantitativeResult_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_QuantitativeResult"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractDQ_Result_Type" abstract="true">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence/>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractDQ_Result" type="gmd:AbstractDQ_Result_Type" abstract="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_Result_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractDQ_Result"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_TemporalValidity_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_TemporalAccuracy_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_TemporalValidity" type="gmd:DQ_TemporalValidity_Type" substitutionGroup="gmd:AbstractDQ_TemporalAccuracy"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_TemporalValidity_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_TemporalValidity"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_TemporalConsistency_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_TemporalAccuracy_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_TemporalConsistency" type="gmd:DQ_TemporalConsistency_Type" substitutionGroup="gmd:AbstractDQ_TemporalAccuracy"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_TemporalConsistency_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_TemporalConsistency"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_AccuracyOfATimeMeasurement_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_TemporalAccuracy_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_AccuracyOfATimeMeasurement" type="gmd:DQ_AccuracyOfATimeMeasurement_Type" substitutionGroup="gmd:AbstractDQ_TemporalAccuracy"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_AccuracyOfATimeMeasurement_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_AccuracyOfATimeMeasurement"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_QuantitativeAttributeAccuracy_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_ThematicAccuracy_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_QuantitativeAttributeAccuracy" type="gmd:DQ_QuantitativeAttributeAccuracy_Type" substitutionGroup="gmd:AbstractDQ_ThematicAccuracy"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_QuantitativeAttributeAccuracy_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_QuantitativeAttributeAccuracy"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_NonQuantitativeAttributeAccuracy_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_ThematicAccuracy_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_NonQuantitativeAttributeAccuracy" type="gmd:DQ_NonQuantitativeAttributeAccuracy_Type" substitutionGroup="gmd:AbstractDQ_ThematicAccuracy"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_NonQuantitativeAttributeAccuracy_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_NonQuantitativeAttributeAccuracy"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_ThematicClassificationCorrectness_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_ThematicAccuracy_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_ThematicClassificationCorrectness" type="gmd:DQ_ThematicClassificationCorrectness_Type" substitutionGroup="gmd:AbstractDQ_ThematicAccuracy"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_ThematicClassificationCorrectness_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_ThematicClassificationCorrectness"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_RelativeInternalPositionalAccuracy_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_PositionalAccuracy_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_RelativeInternalPositionalAccuracy" type="gmd:DQ_RelativeInternalPositionalAccuracy_Type" substitutionGroup="gmd:AbstractDQ_PositionalAccuracy"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_RelativeInternalPositionalAccuracy_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_RelativeInternalPositionalAccuracy"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_GriddedDataPositionalAccuracy_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_PositionalAccuracy_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_GriddedDataPositionalAccuracy" type="gmd:DQ_GriddedDataPositionalAccuracy_Type" substitutionGroup="gmd:AbstractDQ_PositionalAccuracy"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_GriddedDataPositionalAccuracy_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_GriddedDataPositionalAccuracy"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_AbsoluteExternalPositionalAccuracy_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_PositionalAccuracy_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_AbsoluteExternalPositionalAccuracy" type="gmd:DQ_AbsoluteExternalPositionalAccuracy_Type" substitutionGroup="gmd:AbstractDQ_PositionalAccuracy"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_AbsoluteExternalPositionalAccuracy_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_AbsoluteExternalPositionalAccuracy"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_TopologicalConsistency_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_LogicalConsistency_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_TopologicalConsistency" type="gmd:DQ_TopologicalConsistency_Type" substitutionGroup="gmd:AbstractDQ_LogicalConsistency"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_TopologicalConsistency_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_TopologicalConsistency"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_FormatConsistency_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_LogicalConsistency_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_FormatConsistency" type="gmd:DQ_FormatConsistency_Type" substitutionGroup="gmd:AbstractDQ_LogicalConsistency"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_FormatConsistency_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_FormatConsistency"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_DomainConsistency_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_LogicalConsistency_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_DomainConsistency" type="gmd:DQ_DomainConsistency_Type" substitutionGroup="gmd:AbstractDQ_LogicalConsistency"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_DomainConsistency_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_DomainConsistency"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_ConceptualConsistency_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_LogicalConsistency_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_ConceptualConsistency" type="gmd:DQ_ConceptualConsistency_Type" substitutionGroup="gmd:AbstractDQ_LogicalConsistency"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_ConceptualConsistency_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_ConceptualConsistency"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_CompletenessOmission_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_Completeness_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_CompletenessOmission" type="gmd:DQ_CompletenessOmission_Type" substitutionGroup="gmd:AbstractDQ_Completeness"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_CompletenessOmission_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_CompletenessOmission"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_CompletenessCommission_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_Completeness_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_CompletenessCommission" type="gmd:DQ_CompletenessCommission_Type" substitutionGroup="gmd:AbstractDQ_Completeness"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_CompletenessCommission_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_CompletenessCommission"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractDQ_TemporalAccuracy_Type" abstract="true">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_Element_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractDQ_TemporalAccuracy" type="gmd:AbstractDQ_TemporalAccuracy_Type" abstract="true" substitutionGroup="gmd:AbstractDQ_Element"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_TemporalAccuracy_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractDQ_TemporalAccuracy"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractDQ_ThematicAccuracy_Type" abstract="true">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_Element_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractDQ_ThematicAccuracy" type="gmd:AbstractDQ_ThematicAccuracy_Type" abstract="true" substitutionGroup="gmd:AbstractDQ_Element"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_ThematicAccuracy_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractDQ_ThematicAccuracy"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractDQ_PositionalAccuracy_Type" abstract="true">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_Element_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractDQ_PositionalAccuracy" type="gmd:AbstractDQ_PositionalAccuracy_Type" abstract="true" substitutionGroup="gmd:AbstractDQ_Element"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_PositionalAccuracy_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractDQ_PositionalAccuracy"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractDQ_LogicalConsistency_Type" abstract="true">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_Element_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractDQ_LogicalConsistency" type="gmd:AbstractDQ_LogicalConsistency_Type" abstract="true" substitutionGroup="gmd:AbstractDQ_Element"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_LogicalConsistency_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractDQ_LogicalConsistency"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractDQ_Completeness_Type" abstract="true">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractDQ_Element_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractDQ_Completeness" type="gmd:AbstractDQ_Completeness_Type" abstract="true" substitutionGroup="gmd:AbstractDQ_Element"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_Completeness_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractDQ_Completeness"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractDQ_Element_Type" abstract="true">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="nameOfMeasure" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="measureIdentification" type="gmd:MD_Identifier_PropertyType" minOccurs="0"/>
					<xs:element name="measureDescription" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="evaluationMethodType" type="gmd:DQ_EvaluationMethodTypeCode_PropertyType" minOccurs="0"/>
					<xs:element name="evaluationMethodDescription" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="evaluationProcedure" type="gmd:CI_Citation_PropertyType" minOccurs="0"/>
					<xs:element name="dateTime" type="gco:DateTime_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="result" type="gmd:DQ_Result_PropertyType" maxOccurs="2"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractDQ_Element" type="gmd:AbstractDQ_Element_Type" abstract="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_Element_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractDQ_Element"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_DataQuality_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="scope" type="gmd:DQ_Scope_PropertyType"/>
					<xs:element name="report" type="gmd:DQ_Element_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="lineage" type="gmd:LI_Lineage_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_DataQuality" type="gmd:DQ_DataQuality_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_DataQuality_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_DataQuality"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DQ_Scope_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="level" type="gmd:MD_ScopeCode_PropertyType"/>
					<xs:element name="extent" type="gmd:EX_Extent_PropertyType" minOccurs="0"/>
					<xs:element name="levelDescription" type="gmd:MD_ScopeDescription_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DQ_Scope" type="gmd:DQ_Scope_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_Scope_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_Scope"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="DQ_EvaluationMethodTypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DQ_EvaluationMethodTypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DQ_EvaluationMethodTypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/freeText.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This freeText.xsd schema implements cultural and linguistic adaptability extensions defined in 7.3 of ISO/TS 19139:2007. This extension essentially formalizes the free text concept described in Annex J of ISO 19115:2003. For this reason, and in order to simplify the organization of overall geographic metadata XML schema, this schema has been included as part of the gmd namespace instead of the gmx namespace.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="identification.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="PT_FreeText_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="textGroup" type="gmd:LocalisedCharacterString_PropertyType" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="PT_FreeText" type="gmd:PT_FreeText_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="PT_FreeText_PropertyType">
		<xs:complexContent>
			<xs:extension base="gco:CharacterString_PropertyType">
				<xs:sequence minOccurs="0">
					<xs:element ref="gmd:PT_FreeText"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="PT_Locale_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="languageCode" type="gmd:LanguageCode_PropertyType"/>
					<xs:element name="country" type="gmd:Country_PropertyType" minOccurs="0"/>
					<xs:element name="characterEncoding" type="gmd:MD_CharacterSetCode_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="PT_Locale" type="gmd:PT_Locale_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="PT_Locale_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:PT_Locale"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="LocalisedCharacterString_Type">
		<xs:simpleContent>
			<xs:extension base="xs:string">
				<xs:attribute name="id" type="xs:ID"/>
				<xs:attribute name="locale" type="xs:anyURI"/>
			</xs:extension>
		</xs:simpleContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="LocalisedCharacterString" type="gmd:LocalisedCharacterString_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="LocalisedCharacterString_PropertyType">
		<xs:complexContent>
			<xs:extension base="gco:ObjectReference_PropertyType">
				<xs:sequence minOccurs="0">
					<xs:element ref="gmd:LocalisedCharacterString"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="PT_LocaleContainer_Type">
		<xs:sequence>
			<xs:element name="description" type="gco:CharacterString_PropertyType"/>
			<xs:element name="locale" type="gmd:PT_Locale_PropertyType"/>
			<xs:element name="date" type="gmd:CI_Date_PropertyType" maxOccurs="unbounded"/>
			<xs:element name="responsibleParty" type="gmd:CI_ResponsibleParty_PropertyType" maxOccurs="unbounded"/>
			<xs:element name="localisedString" type="gmd:LocalisedCharacterString_PropertyType" maxOccurs="unbounded"/>
		</xs:sequence>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="PT_LocaleContainer" type="gmd:PT_LocaleContainer_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="PT_LocaleContainer_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:PT_LocaleContainer"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- =========================================================================== -->
	<!-- =========================================================================== -->
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="LanguageCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="LanguageCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:LanguageCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="Country" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="Country_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:Country"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!--====EOF====-->
</xs:schema>
`],['http://schemas.opengis.net/gml/3.2.1/temporal.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:temporal:3.2.2">temporal.xsd</appinfo>
		<documentation>See ISO/DIS 19136 15.2.
The GML temporal schemas include components for describing temporal geometry and topology, temporal reference systems, and the temporal characteristics of geographic data. The model underlying the representation constitutes a profile of the conceptual schema described in ISO 19108. The underlying spatiotemporal model strives to accommodate both feature-level and attribute-level time stamping; basic support for tracking moving objects is also included. 
Time is measured on two types of scales: interval and ordinal.  An interval scale offers a basis for measuring duration, an ordinal scale provides information only about relative position in time.
Two other ISO standards are relevant to describing temporal objects:  ISO 8601 describes encodings for time instants and time periods, as text strings with particular structure and punctuation; ISO 11404 provides a detailed description of time intervals as part of a general discussion of language independent datatypes.  
The temporal schemas cover two interrelated topics and provide basic schema components for representing temporal instants and periods, temporal topology, and reference systems; more specialized schema components defines components used for dynamic features. Instances of temporal geometric types are used as values for the temporal properties of geographic features.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="gmlBase.xsd"/>
	<element name="AbstractTimeObject" type="gml:AbstractTimeObjectType" abstract="true" substitutionGroup="gml:AbstractGML">
		<annotation>
			<documentation>gml:AbstractTimeObject acts as the head of a substitution group for all temporal primitives and complexes.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractTimeObjectType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractGMLType"/>
		</complexContent>
	</complexType>
	<element name="AbstractTimePrimitive" type="gml:AbstractTimePrimitiveType" abstract="true" substitutionGroup="gml:AbstractTimeObject">
		<annotation>
			<documentation>gml:AbstractTimePrimitive acts as the head of a substitution group for geometric and topological temporal primitives.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractTimePrimitiveType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractTimeObjectType">
				<sequence>
					<element name="relatedTime" type="gml:RelatedTimeType" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimePrimitivePropertyType">
		<annotation>
			<documentation>gml:TimePrimitivePropertyType provides a standard content model for associations between an arbitrary member of the substitution group whose head is gml:AbstractTimePrimitive and another object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractTimePrimitive"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="validTime" type="gml:TimePrimitivePropertyType">
		<annotation>
			<documentation>gml:validTime is a convenience property element.</documentation>
		</annotation>
	</element>
	<complexType name="RelatedTimeType">
		<annotation>
			<documentation>gml:RelatedTimeType provides a content model for indicating the relative position of an arbitrary member of the substitution group whose head is gml:AbstractTimePrimitive. It extends the generic gml:TimePrimitivePropertyType with an XML attribute relativePosition, whose value is selected from the set of 13 temporal relationships identified by Allen (1983)</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:TimePrimitivePropertyType">
				<attribute name="relativePosition">
					<simpleType>
						<restriction base="string">
							<enumeration value="Before"/>
							<enumeration value="After"/>
							<enumeration value="Begins"/>
							<enumeration value="Ends"/>
							<enumeration value="During"/>
							<enumeration value="Equals"/>
							<enumeration value="Contains"/>
							<enumeration value="Overlaps"/>
							<enumeration value="Meets"/>
							<enumeration value="OverlappedBy"/>
							<enumeration value="MetBy"/>
							<enumeration value="BegunBy"/>
							<enumeration value="EndedBy"/>
						</restriction>
					</simpleType>
				</attribute>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractTimeComplex" type="gml:AbstractTimeComplexType" abstract="true" substitutionGroup="gml:AbstractTimeObject">
		<annotation>
			<documentation>gml:AbstractTimeComplex is an aggregation of temporal primitives and acts as the head of a substitution group for temporal complexes.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractTimeComplexType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractTimeObjectType"/>
		</complexContent>
	</complexType>
	<element name="AbstractTimeGeometricPrimitive" type="gml:AbstractTimeGeometricPrimitiveType" abstract="true" substitutionGroup="gml:AbstractTimePrimitive">
		<annotation>
			<documentation>gml:TimeGeometricPrimitive acts as the head of a substitution group for geometric temporal primitives.
A temporal geometry shall be associated with a temporal reference system through the frame attribute that provides a URI reference that identifies a description of the reference system. Following ISO 19108, the Gregorian calendar with UTC is the default reference system, but others may also be used. The GPS calendar is an alternative reference systems in common use.
The two geometric primitives in the temporal dimension are the instant and the period. GML components are defined to support these as follows.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractTimeGeometricPrimitiveType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractTimePrimitiveType">
				<attribute name="frame" type="anyURI" default="#ISO-8601"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="TimeInstant" type="gml:TimeInstantType" substitutionGroup="gml:AbstractTimeGeometricPrimitive">
		<annotation>
			<documentation>gml:TimeInstant acts as a zero-dimensional geometric primitive that represents an identifiable position in time.</documentation>
		</annotation>
	</element>
	<complexType name="TimeInstantType" final="#all">
		<complexContent>
			<extension base="gml:AbstractTimeGeometricPrimitiveType">
				<sequence>
					<element ref="gml:timePosition"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimeInstantPropertyType">
		<annotation>
			<documentation>gml:TimeInstantPropertyType provides for associating a gml:TimeInstant with an object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimeInstant"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="TimePeriod" type="gml:TimePeriodType" substitutionGroup="gml:AbstractTimeGeometricPrimitive">
		<annotation>
			<documentation>gml:TimePeriod acts as a one-dimensional geometric primitive that represents an identifiable extent in time.
The location in of a gml:TimePeriod is described by the temporal positions of the instants at which it begins and ends. The length of the period is equal to the temporal distance between the two bounding temporal positions. 
Both beginning and end may be described in terms of their direct position using gml:TimePositionType which is an XML Schema simple content type, or by reference to an indentifiable time instant using gml:TimeInstantPropertyType.
Alternatively a limit of a gml:TimePeriod may use the conventional GML property model to make a reference to a time instant described elsewhere, or a limit may be indicated as a direct position.</documentation>
		</annotation>
	</element>
	<complexType name="TimePeriodType">
		<complexContent>
			<extension base="gml:AbstractTimeGeometricPrimitiveType">
				<sequence>
					<choice>
						<element name="beginPosition" type="gml:TimePositionType"/>
						<element name="begin" type="gml:TimeInstantPropertyType"/>
					</choice>
					<choice>
						<element name="endPosition" type="gml:TimePositionType"/>
						<element name="end" type="gml:TimeInstantPropertyType"/>
					</choice>
					<group ref="gml:timeLength" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="TimePeriodPropertyType">
		<annotation>
			<documentation>gml:TimePeriodPropertyType provides for associating a gml:TimePeriod with an object.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:TimePeriod"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="TimePositionType" final="#all">
		<annotation>
			<documentation>The method for identifying a temporal position is specific to each temporal reference system.  gml:TimePositionType supports the description of temporal position according to the subtypes described in ISO 19108.
Values based on calendars and clocks use lexical formats that are based on ISO 8601, as described in XML Schema Part 2:2001. A decimal value may be used with coordinate systems such as GPS time or UNIX time. A URI may be used to provide a reference to some era in an ordinal reference system . 
In common with many of the components modelled as data types in the ISO 19100 series of International Standards, the corresponding GML component has simple content. However, the content model gml:TimePositionType is defined in several steps.
Three XML attributes appear on gml:TimePositionType:
A time value shall be associated with a temporal reference system through the frame attribute that provides a URI reference that identifies a description of the reference system. Following ISO 19108, the Gregorian calendar with UTC is the default reference system, but others may also be used. Components for describing temporal reference systems are described in 14.4, but it is not required that the reference system be described in this, as the reference may refer to anything that may be indentified with a URI.  
For time values using a calendar containing more than one era, the (optional) calendarEraName attribute provides the name of the calendar era.  
Inexact temporal positions may be expressed using the optional indeterminatePosition attribute.  This takes a value from an enumeration.</documentation>
		</annotation>
		<simpleContent>
			<extension base="gml:TimePositionUnion">
				<attribute name="frame" type="anyURI" default="#ISO-8601"/>
				<attribute name="calendarEraName" type="string"/>
				<attribute name="indeterminatePosition" type="gml:TimeIndeterminateValueType"/>
			</extension>
		</simpleContent>
	</complexType>
	<simpleType name="TimeIndeterminateValueType">
		<annotation>
			<documentation>These values are interpreted as follows: 
-	"unknown" indicates that no specific value for temporal position is provided.
-	"now" indicates that the specified value shall be replaced with the current temporal position whenever the value is accessed.
-	"before" indicates that the actual temporal position is unknown, but it is known to be before the specified value.
-	"after" indicates that the actual temporal position is unknown, but it is known to be after the specified value.
A value for indeterminatePosition may 
-	be used either alone, or 
-	qualify a specific value for temporal position.</documentation>
		</annotation>
		<restriction base="string">
			<enumeration value="after"/>
			<enumeration value="before"/>
			<enumeration value="now"/>
			<enumeration value="unknown"/>
		</restriction>
	</simpleType>
	<simpleType name="TimePositionUnion">
		<annotation>
			<documentation>The simple type gml:TimePositionUnion is a union of XML Schema simple types which instantiate the subtypes for temporal position described in ISO 19108.
 An ordinal era may be referenced via URI.  A decimal value may be used to indicate the distance from the scale origin .  time is used for a position that recurs daily (see ISO 19108:2002 5.4.4.2).
 Finally, calendar and clock forms that support the representation of time in systems based on years, months, days, hours, minutes and seconds, in a notation following ISO 8601, are assembled by gml:CalDate</documentation>
		</annotation>
		<union memberTypes="gml:CalDate time dateTime anyURI decimal"/>
	</simpleType>
	<simpleType name="CalDate">
		<union memberTypes="date gYearMonth gYear"/>
	</simpleType>
	<element name="timePosition" type="gml:TimePositionType">
		<annotation>
			<documentation>This element is used directly as a property of gml:TimeInstant (see 15.2.2.3), and may also be used in application schemas.</documentation>
		</annotation>
	</element>
	<group name="timeLength">
		<annotation>
			<documentation>The length of a time period.</documentation>
		</annotation>
		<choice>
			<element ref="gml:duration"/>
			<element ref="gml:timeInterval"/>
		</choice>
	</group>
	<element name="duration" type="duration">
		<annotation>
			<documentation>gml:duration conforms to the ISO 8601 syntax for temporal length as implemented by the XML Schema duration type.</documentation>
		</annotation>
	</element>
	<element name="timeInterval" type="gml:TimeIntervalLengthType">
		<annotation>
			<documentation> gml:timeInterval conforms to ISO 11404 which is based on floating point values for temporal length.
ISO 11404 syntax specifies the use of a positiveInteger together with appropriate values for radix and factor. The resolution of the time interval is to one radix ^(-factor) of the specified time unit.
The value of the unit is either selected from the units for time intervals from ISO 31-1:1992, or is another suitable unit.  The encoding is defined for GML in gml:TimeUnitType. The second component of this union type provides a method for indicating time units other than the six standard units given in the enumeration.</documentation>
		</annotation>
	</element>
	<complexType name="TimeIntervalLengthType" final="#all">
		<simpleContent>
			<extension base="decimal">
				<attribute name="unit" type="gml:TimeUnitType" use="required"/>
				<attribute name="radix" type="positiveInteger"/>
				<attribute name="factor" type="integer"/>
			</extension>
		</simpleContent>
	</complexType>
	<simpleType name="TimeUnitType">
		<union>
			<simpleType>
				<restriction base="string">
					<enumeration value="year"/>
					<enumeration value="month"/>
					<enumeration value="day"/>
					<enumeration value="hour"/>
					<enumeration value="minute"/>
					<enumeration value="second"/>
				</restriction>
			</simpleType>
			<simpleType>
				<restriction base="string">
					<pattern value="other:\w{2,}"/>
				</restriction>
			</simpleType>
		</union>
	</simpleType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/geometryBasic0d1d.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:geometryBasic0d1d:3.2.2">geometryBasic0d1d.xsd</appinfo>
		<documentation>See ISO/DIS 19136 Clause 10.
Any geometry element that inherits the semantics of AbstractGeometryType may be viewed as a set of direct positions. 
All of the classes derived from AbstractGeometryType inherit an optional association to a coordinate reference system. All direct positions shall directly or indirectly be associated with a coordinate reference system. When geometry elements are aggregated in another geometry element (such as a MultiGeometry or GeometricComplex), which already has a coordinate reference system specified, then these elements are assumed to be in that same coordinate reference system unless otherwise specified.
The geometry model distinguishes geometric primitives, aggregates and complexes. 
Geometric primitives, i.e. instances of a subtype of AbstractGeometricPrimitiveType, will be open, that is, they will not contain their boundary points; curves will not contain their end points, surfaces will not contain their boundary curves, and solids will not contain their bounding surfaces.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="measures.xsd"/>
	<complexType name="AbstractGeometryType" abstract="true">
		<annotation>
			<documentation>All geometry elements are derived directly or indirectly from this abstract supertype. A geometry element may have an identifying attribute (gml:id), one or more names (elements identifier and name) and a description (elements description and descriptionReference) . It may be associated with a spatial reference system (attribute group gml:SRSReferenceGroup).
The following rules shall be adhered to:
-	Every geometry type shall derive from this abstract type.
-	Every geometry element (i.e. an element of a geometry type) shall be directly or indirectly in the substitution group of AbstractGeometry.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractGMLType">
				<attributeGroup ref="gml:SRSReferenceGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<attributeGroup name="SRSReferenceGroup">
		<annotation>
			<documentation>The attribute group SRSReferenceGroup is an optional reference to the CRS used by this geometry, with optional additional information to simplify the processing of the coordinates when a more complete definition of the CRS is not needed.
In general the attribute srsName points to a CRS instance of gml:AbstractCoordinateReferenceSystem. For well-known references it is not required that the CRS description exists at the location the URI points to. 
If no srsName attribute is given, the CRS shall be specified as part of the larger context this geometry element is part of.</documentation>
		</annotation>
		<attribute name="srsName" type="anyURI"/>
		<attribute name="srsDimension" type="positiveInteger"/>
		<attributeGroup ref="gml:SRSInformationGroup"/>
	</attributeGroup>
	<attributeGroup name="SRSInformationGroup">
		<annotation>
			<documentation>The attributes uomLabels and axisLabels, defined in the SRSInformationGroup attribute group, are optional additional and redundant information for a CRS to simplify the processing of the coordinate values when a more complete definition of the CRS is not needed. This information shall be the same as included in the complete definition of the CRS, referenced by the srsName attribute. When the srsName attribute is included, either both or neither of the axisLabels and uomLabels attributes shall be included. When the srsName attribute is omitted, both of these attributes shall be omitted.
The attribute axisLabels is an ordered list of labels for all the axes of this CRS. The gml:axisAbbrev value should be used for these axis labels, after spaces and forbidden characters are removed. When the srsName attribute is included, this attribute is optional. When the srsName attribute is omitted, this attribute shall also be omitted.
The attribute uomLabels is an ordered list of unit of measure (uom) labels for all the axes of this CRS. The value of the string in the gml:catalogSymbol should be used for this uom labels, after spaces and forbidden characters are removed. When the axisLabels attribute is included, this attribute shall also be included. When the axisLabels attribute is omitted, this attribute shall also be omitted.</documentation>
		</annotation>
		<attribute name="axisLabels" type="gml:NCNameList"/>
		<attribute name="uomLabels" type="gml:NCNameList"/>
	</attributeGroup>
	<element name="AbstractGeometry" type="gml:AbstractGeometryType" abstract="true" substitutionGroup="gml:AbstractGML">
		<annotation>
			<documentation>The AbstractGeometry element is the abstract head of the substitution group for all geometry elements of GML. This includes pre-defined and user-defined geometry elements. Any geometry element shall be a direct or indirect extension/restriction of AbstractGeometryType and shall be directly or indirectly in the substitution group of AbstractGeometry.</documentation>
		</annotation>
	</element>
	<complexType name="GeometryPropertyType">
		<annotation>
			<documentation>A geometric property may either be any geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same or another document). Note that either the reference or the contained element shall be given, but not both or none.
If a feature has a property that takes a geometry element as its value, this is called a geometry property. A generic type for such a geometry property is GeometryPropertyType.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractGeometry"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="GeometryArrayPropertyType">
		<annotation>
			<documentation>If a feature has a property which takes an array of geometry elements as its value, this is called a geometry array property. A generic type for such a geometry property is GeometryArrayPropertyType. 
The elements are always contained inline in the array property, referencing geometry elements or arrays of geometry elements via XLinks is not supported.</documentation>
		</annotation>
		<sequence minOccurs="0" maxOccurs="unbounded">
			<element ref="gml:AbstractGeometry"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="DirectPositionType">
		<annotation>
			<documentation>Direct position instances hold the coordinates for a position within some coordinate reference system (CRS). Since direct positions, as data types, will often be included in larger objects (such as geometry elements) that have references to CRS, the srsName attribute will in general be missing, if this particular direct position is included in a larger element with such a reference to a CRS. In this case, the CRS is implicitly assumed to take on the value of the containing object's CRS.
if no srsName attribute is given, the CRS shall be specified as part of the larger context this geometry element is part of, typically a geometric object like a point, curve, etc.</documentation>
		</annotation>
		<simpleContent>
			<extension base="gml:doubleList">
				<attributeGroup ref="gml:SRSReferenceGroup"/>
			</extension>
		</simpleContent>
	</complexType>
	<element name="pos" type="gml:DirectPositionType"/>
	<complexType name="DirectPositionListType">
		<annotation>
			<documentation>posList instances (and other instances with the content model specified by DirectPositionListType) hold the coordinates for a sequence of direct positions within the same coordinate reference system (CRS).
if no srsName attribute is given, the CRS shall be specified as part of the larger context this geometry element is part of, typically a geometric object like a point, curve, etc. 
The optional attribute count specifies the number of direct positions in the list. If the attribute count is present then the attribute srsDimension shall be present, too.
The number of entries in the list is equal to the product of the dimensionality of the coordinate reference system (i.e. it is a derived value of the coordinate reference system definition) and the number of direct positions.</documentation>
		</annotation>
		<simpleContent>
			<extension base="gml:doubleList">
				<attributeGroup ref="gml:SRSReferenceGroup"/>
				<attribute name="count" type="positiveInteger"/>
			</extension>
		</simpleContent>
	</complexType>
	<element name="posList" type="gml:DirectPositionListType"/>
	<group name="geometricPositionGroup">
		<annotation>
			<documentation>GML supports two different ways to specify a geometric position: either by a direct position (a data type) or a point (a geometric object).
pos elements are positions that are "owned" by the geometric primitive encapsulating this geometric position.
pointProperty elements contain a point that may be referenced from other geometry elements or reference another point defined elsewhere (reuse of existing points).</documentation>
		</annotation>
		<choice>
			<element ref="gml:pos"/>
			<element ref="gml:pointProperty"/>
		</choice>
	</group>
	<group name="geometricPositionListGroup">
		<annotation>
			<documentation>GML supports two different ways to specify a list of geometric positions: either by a sequence of geometric positions (by reusing the group definition) or a sequence of direct positions (element posList). 
The posList element allows for a compact way to specify the coordinates of the positions, if all positions are represented in the same coordinate reference system.</documentation>
		</annotation>
		<choice>
			<element ref="gml:posList"/>
			<group ref="gml:geometricPositionGroup" maxOccurs="unbounded"/>
		</choice>
	</group>
	<complexType name="VectorType">
		<annotation>
			<documentation>For some applications the components of the position may be adjusted to yield a unit vector.</documentation>
		</annotation>
		<simpleContent>
			<restriction base="gml:DirectPositionType"/>
		</simpleContent>
	</complexType>
	<element name="vector" type="gml:VectorType"/>
	<complexType name="EnvelopeType">
		<choice>
			<sequence>
				<element name="lowerCorner" type="gml:DirectPositionType"/>
				<element name="upperCorner" type="gml:DirectPositionType"/>
			</sequence>
			<element ref="gml:pos" minOccurs="2" maxOccurs="2">
				<annotation>
					<appinfo>deprecated</appinfo>
				</annotation>
			</element>
			<element ref="gml:coordinates"/>
		</choice>
		<attributeGroup ref="gml:SRSReferenceGroup"/>
	</complexType>
	<element name="Envelope" type="gml:EnvelopeType" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>Envelope defines an extent using a pair of positions defining opposite corners in arbitrary dimensions. The first direct position is the "lower corner" (a coordinate position consisting of all the minimal ordinates for each dimension for all points within the envelope), the second one the "upper corner" (a coordinate position consisting of all the maximal ordinates for each dimension for all points within the envelope).
The use of the properties "coordinates" and "pos" has been deprecated. The explicitly named properties "lowerCorner" and "upperCorner" shall be used instead.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractGeometricPrimitiveType" abstract="true">
		<annotation>
			<documentation>gml:AbstractGeometricPrimitiveType is the abstract root type of the geometric primitives. A geometric primitive is a geometric object that is not decomposed further into other primitives in the system. All primitives are oriented in the direction implied by the sequence of their coordinate tuples.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractGeometryType"/>
		</complexContent>
	</complexType>
	<element name="AbstractGeometricPrimitive" type="gml:AbstractGeometricPrimitiveType" abstract="true" substitutionGroup="gml:AbstractGeometry">
		<annotation>
			<documentation>The AbstractGeometricPrimitive element is the abstract head of the substitution group for all (pre- and user-defined) geometric primitives.</documentation>
		</annotation>
	</element>
	<complexType name="GeometricPrimitivePropertyType">
		<annotation>
			<documentation>A property that has a geometric primitive as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractGeometricPrimitive"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<complexType name="PointType">
		<complexContent>
			<extension base="gml:AbstractGeometricPrimitiveType">
				<sequence>
					<choice>
						<element ref="gml:pos"/>
						<element ref="gml:coordinates"/>
					</choice>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="Point" type="gml:PointType" substitutionGroup="gml:AbstractGeometricPrimitive">
		<annotation>
			<documentation>A Point is defined by a single coordinate tuple. The direct position of a point is specified by the pos element which is of type DirectPositionType.</documentation>
		</annotation>
	</element>
	<complexType name="PointPropertyType">
		<annotation>
			<documentation>A property that has a point as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:Point"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="pointProperty" type="gml:PointPropertyType">
		<annotation>
			<documentation>This property element either references a point via the XLink-attributes or contains the point element. pointProperty is the predefined property which may be used by GML Application Schemas whenever a GML feature has a property with a value that is substitutable for Point.</documentation>
		</annotation>
	</element>
	<complexType name="PointArrayPropertyType">
		<annotation>
			<documentation>gml:PointArrayPropertyType is a container for an array of points. The elements are always contained inline in the array property, referencing geometry elements or arrays of geometry elements via XLinks is not supported.</documentation>
		</annotation>
		<sequence minOccurs="0" maxOccurs="unbounded">
			<element ref="gml:Point"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="AbstractCurveType" abstract="true">
		<annotation>
			<documentation>gml:AbstractCurveType is an abstraction of a curve to support the different levels of complexity. The curve may always be viewed as a geometric primitive, i.e. is continuous.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractGeometricPrimitiveType"/>
		</complexContent>
	</complexType>
	<element name="AbstractCurve" type="gml:AbstractCurveType" abstract="true" substitutionGroup="gml:AbstractGeometricPrimitive">
		<annotation>
			<documentation>The AbstractCurve element is the abstract head of the substitution group for all (continuous) curve elements.</documentation>
		</annotation>
	</element>
	<complexType name="CurvePropertyType">
		<annotation>
			<documentation>A property that has a curve as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractCurve"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="curveProperty" type="gml:CurvePropertyType">
		<annotation>
			<documentation>This property element either references a curve via the XLink-attributes or contains the curve element. curveProperty is the predefined property which may be used by GML Application Schemas whenever a GML feature has a property with a value that is substitutable for AbstractCurve.</documentation>
		</annotation>
	</element>
	<complexType name="CurveArrayPropertyType">
		<annotation>
			<documentation>A container for an array of curves. The elements are always contained in the array property, referencing geometry elements or arrays of geometry elements via XLinks is not supported.</documentation>
		</annotation>
		<sequence minOccurs="0" maxOccurs="unbounded">
			<element ref="gml:AbstractCurve"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="LineStringType">
		<complexContent>
			<extension base="gml:AbstractCurveType">
				<sequence>
					<choice>
						<choice minOccurs="2" maxOccurs="unbounded">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="LineString" type="gml:LineStringType" substitutionGroup="gml:AbstractCurve">
		<annotation>
			<documentation>A LineString is a special curve that consists of a single segment with linear interpolation. It is defined by two or more coordinate tuples, with linear interpolation between them. The number of direct positions in the list shall be at least two.</documentation>
		</annotation>
	</element>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/geometryPrimitives.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:geometryPrimitives:3.2.2">geometryPrimitives.xsd</appinfo>
		<documentation>See ISO/DIS 19136 Clause 11.
Beside the "simple" geometric primitives specified in the previous Clause, this Clause specifies additional primitives to describe real world situations which require a more expressive geometry model.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="geometryBasic2d.xsd"/>
	<complexType name="CurveType">
		<complexContent>
			<extension base="gml:AbstractCurveType">
				<sequence>
					<element ref="gml:segments"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="Curve" type="gml:CurveType" substitutionGroup="gml:AbstractCurve">
		<annotation>
			<documentation>A curve is a 1-dimensional primitive. Curves are continuous, connected, and have a measurable length in terms of the coordinate system. 
A curve is composed of one or more curve segments. Each curve segment within a curve may be defined using a different interpolation method. The curve segments are connected to one another, with the end point of each segment except the last being the start point of the next segment in the segment list.
The orientation of the curve is positive.
The element segments encapsulates the segments of the curve.</documentation>
		</annotation>
	</element>
	<complexType name="OrientableCurveType">
		<complexContent>
			<extension base="gml:AbstractCurveType">
				<sequence>
					<element ref="gml:baseCurve"/>
				</sequence>
				<attribute name="orientation" type="gml:SignType" default="+"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="baseCurve" type="gml:CurvePropertyType">
		<annotation>
			<documentation>The property baseCurve references or contains the base curve, i.e. it either references the base curve via the XLink-attributes or contains the curve element. A curve element is any element which is substitutable for AbstractCurve. The base curve has positive orientation.</documentation>
		</annotation>
	</element>
	<element name="OrientableCurve" type="gml:OrientableCurveType" substitutionGroup="gml:AbstractCurve">
		<annotation>
			<documentation>OrientableCurve consists of a curve and an orientation. If the orientation is "+", then the OrientableCurve is identical to the baseCurve. If the orientation is "-", then the OrientableCurve is related to another AbstractCurve with a parameterization that reverses the sense of the curve traversal.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractCurveSegmentType" abstract="true">
		<attribute name="numDerivativesAtStart" type="integer" default="0"/>
		<attribute name="numDerivativesAtEnd" type="integer" default="0"/>
		<attribute name="numDerivativeInterior" type="integer" default="0"/>
	</complexType>
	<element name="AbstractCurveSegment" type="gml:AbstractCurveSegmentType" abstract="true" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>A curve segment defines a homogeneous segment of a curve.
The attributes numDerivativesAtStart, numDerivativesAtEnd and numDerivativesInterior specify the type of continuity as specified in ISO 19107:2003, 6.4.9.3.
The AbstractCurveSegment element is the abstract head of the substituition group for all curve segment elements, i.e. continuous segments of the same interpolation mechanism.
All curve segments shall have an attribute interpolation with type gml:CurveInterpolationType specifying the curve interpolation mechanism used for this segment. This mechanism uses the control points and control parameters to determine the position of this curve segment.</documentation>
		</annotation>
	</element>
	<complexType name="CurveSegmentArrayPropertyType">
		<annotation>
			<documentation>gml:CurveSegmentArrayPropertyType is a container for an array of curve segments.</documentation>
		</annotation>
		<sequence minOccurs="0" maxOccurs="unbounded">
			<element ref="gml:AbstractCurveSegment"/>
		</sequence>
	</complexType>
	<element name="segments" type="gml:CurveSegmentArrayPropertyType">
		<annotation>
			<documentation>This property element contains a list of curve segments. The order of the elements is significant and shall be preserved when processing the array.</documentation>
		</annotation>
	</element>
	<simpleType name="CurveInterpolationType">
		<annotation>
			<documentation>gml:CurveInterpolationType is a list of codes that may be used to identify the interpolation mechanisms specified by an application schema.</documentation>
		</annotation>
		<restriction base="string">
			<enumeration value="linear"/>
			<enumeration value="geodesic"/>
			<enumeration value="circularArc3Points"/>
			<enumeration value="circularArc2PointWithBulge"/>
			<enumeration value="circularArcCenterPointWithRadius"/>
			<enumeration value="elliptical"/>
			<enumeration value="clothoid"/>
			<enumeration value="conic"/>
			<enumeration value="polynomialSpline"/>
			<enumeration value="cubicSpline"/>
			<enumeration value="rationalSpline"/>
		</restriction>
	</simpleType>
	<complexType name="LineStringSegmentType">
		<complexContent>
			<extension base="gml:AbstractCurveSegmentType">
				<sequence>
					<choice>
						<choice minOccurs="2" maxOccurs="unbounded">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
				</sequence>
				<attribute name="interpolation" type="gml:CurveInterpolationType" fixed="linear"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="LineStringSegment" type="gml:LineStringSegmentType" substitutionGroup="gml:AbstractCurveSegment">
		<annotation>
			<documentation>A LineStringSegment is a curve segment that is defined by two or more control points including the start and end point, with linear interpolation between them.
The content model follows the general pattern for the encoding of curve segments.</documentation>
		</annotation>
	</element>
	<complexType name="ArcStringType">
		<complexContent>
			<extension base="gml:AbstractCurveSegmentType">
				<sequence>
					<choice>
						<choice minOccurs="3" maxOccurs="unbounded">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
				</sequence>
				<attribute name="interpolation" type="gml:CurveInterpolationType" fixed="circularArc3Points"/>
				<attribute name="numArc" type="integer"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="ArcString" type="gml:ArcStringType" substitutionGroup="gml:AbstractCurveSegment">
		<annotation>
			<documentation>An ArcString is a curve segment that uses three-point circular arc interpolation ("circularArc3Points"). The number of arcs in the arc string may be explicitly stated in the attribute numArc. The number of control points in the arc string shall be 2 * numArc + 1.
The content model follows the general pattern for the encoding of curve segments.</documentation>
		</annotation>
	</element>
	<complexType name="ArcType">
		<complexContent>
			<restriction base="gml:ArcStringType">
				<sequence>
					<choice>
						<choice minOccurs="3" maxOccurs="3">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
				</sequence>
				<attribute name="numArc" type="integer" fixed="1"/>
			</restriction>
		</complexContent>
	</complexType>
	<element name="Arc" type="gml:ArcType" substitutionGroup="gml:ArcString">
		<annotation>
			<documentation>An Arc is an arc string with only one arc unit, i.e. three control points including the start and end point. As arc is an arc string consisting of a single arc, the attribute "numArc" is fixed to "1".</documentation>
		</annotation>
	</element>
	<complexType name="CircleType">
		<complexContent>
			<extension base="gml:ArcType"/>
		</complexContent>
	</complexType>
	<element name="Circle" type="gml:CircleType" substitutionGroup="gml:Arc">
		<annotation>
			<documentation>A Circle is an arc whose ends coincide to form a simple closed loop. The three control points shall be distinct non-co-linear points for the circle to be unambiguously defined. The arc is simply extended past the third control point until the first control point is encountered.</documentation>
		</annotation>
	</element>
	<complexType name="ArcStringByBulgeType">
		<complexContent>
			<extension base="gml:AbstractCurveSegmentType">
				<sequence>
					<choice>
						<choice minOccurs="2" maxOccurs="unbounded">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
					<element name="bulge" type="double" maxOccurs="unbounded"/>
					<element name="normal" type="gml:VectorType" maxOccurs="unbounded"/>
				</sequence>
				<attribute name="interpolation" type="gml:CurveInterpolationType" fixed="circularArc2PointWithBulge"/>
				<attribute name="numArc" type="integer"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="ArcStringByBulge" type="gml:ArcStringByBulgeType" substitutionGroup="gml:AbstractCurveSegment">
		<annotation>
			<documentation>This variant of the arc computes the mid points of the arcs instead of storing the coordinates directly. The control point sequence consists of the start and end points of each arc plus the bulge (see ISO 19107:2003, 6.4.17.2). The normal is a vector normal (perpendicular) to the chord of the arc (see ISO 19107:2003, 6.4.17.4).
The interpolation is fixed as "circularArc2PointWithBulge".
The number of arcs in the arc string may be explicitly stated in the attribute numArc. The number of control points in the arc string shall be numArc + 1.
The content model follows the general pattern for the encoding of curve segments.</documentation>
		</annotation>
	</element>
	<complexType name="ArcByBulgeType">
		<complexContent>
			<restriction base="gml:ArcStringByBulgeType">
				<sequence>
					<choice>
						<choice minOccurs="2" maxOccurs="2">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
					<element name="bulge" type="double"/>
					<element name="normal" type="gml:VectorType"/>
				</sequence>
				<attribute name="numArc" type="integer" fixed="1"/>
			</restriction>
		</complexContent>
	</complexType>
	<element name="ArcByBulge" type="gml:ArcByBulgeType" substitutionGroup="gml:ArcStringByBulge">
		<annotation>
			<documentation>An ArcByBulge is an arc string with only one arc unit, i.e. two control points, one bulge and one normal vector.
As arc is an arc string consisting of a single arc, the attribute "numArc" is fixed to "1".</documentation>
		</annotation>
	</element>
	<complexType name="ArcByCenterPointType">
		<complexContent>
			<extension base="gml:AbstractCurveSegmentType">
				<sequence>
					<choice>
						<choice>
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
					<element name="radius" type="gml:LengthType"/>
					<element name="startAngle" type="gml:AngleType" minOccurs="0"/>
					<element name="endAngle" type="gml:AngleType" minOccurs="0"/>
				</sequence>
				<attribute name="interpolation" type="gml:CurveInterpolationType" fixed="circularArcCenterPointWithRadius"/>
				<attribute name="numArc" type="integer" use="required" fixed="1"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="ArcByCenterPoint" type="gml:ArcByCenterPointType" substitutionGroup="gml:AbstractCurveSegment">
		<annotation>
			<documentation>This variant of the arc requires that the points on the arc shall be computed instead of storing the coordinates directly. The single control point is the center point of the arc plus the radius and the bearing at start and end. This representation can be used only in 2D.
The element radius specifies the radius of the arc.
The element startAngle specifies the bearing of the arc at the start.
The element endAngle specifies the bearing of the arc at the end.
The interpolation is fixed as "circularArcCenterPointWithRadius".
Since this type describes always a single arc, the attribute "numArc" is fixed to "1".
The content model follows the general pattern for the encoding of curve segments.</documentation>
		</annotation>
	</element>
	<complexType name="CircleByCenterPointType">
		<complexContent>
			<restriction base="gml:ArcByCenterPointType">
				<sequence>
					<choice>
						<choice>
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
					<element name="radius" type="gml:LengthType"/>
				</sequence>
			</restriction>
		</complexContent>
	</complexType>
	<element name="CircleByCenterPoint" type="gml:CircleByCenterPointType" substitutionGroup="gml:ArcByCenterPoint">
		<annotation>
			<documentation>A gml:CircleByCenterPoint is an gml:ArcByCenterPoint with identical start and end angle to form a full circle. Again, this representation can be used only in 2D.</documentation>
		</annotation>
	</element>
	<complexType name="CubicSplineType">
		<complexContent>
			<extension base="gml:AbstractCurveSegmentType">
				<sequence>
					<choice>
						<choice minOccurs="2" maxOccurs="unbounded">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
					<element name="vectorAtStart" type="gml:VectorType"/>
					<element name="vectorAtEnd" type="gml:VectorType"/>
				</sequence>
				<attribute name="interpolation" type="gml:CurveInterpolationType" fixed="cubicSpline"/>
				<attribute name="degree" type="integer" fixed="3"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="CubicSpline" type="gml:CubicSplineType" substitutionGroup="gml:AbstractCurveSegment">
		<annotation>
			<documentation>The number of control points shall be at least three.
vectorAtStart is the unit tangent vector at the start point of the spline. vectorAtEnd is the unit tangent vector at the end point of the spline. Only the direction of the vectors shall be used to determine the shape of the cubic spline, not their length.
interpolation is fixed as "cubicSpline".
degree shall be the degree of the polynomial used for the interpolation in this spline. Therefore the degree for a cubic spline is fixed to "3".
The content model follows the general pattern for the encoding of curve segments.</documentation>
		</annotation>
	</element>
	<complexType name="BSplineType">
		<complexContent>
			<extension base="gml:AbstractCurveSegmentType">
				<sequence>
					<choice>
						<choice minOccurs="0" maxOccurs="unbounded">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
					<element name="degree" type="nonNegativeInteger"/>
					<element name="knot" type="gml:KnotPropertyType" minOccurs="2" maxOccurs="unbounded"/>
				</sequence>
				<attribute name="interpolation" type="gml:CurveInterpolationType" default="polynomialSpline"/>
				<attribute name="isPolynomial" type="boolean"/>
				<attribute name="knotType" type="gml:KnotTypesType"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="BSpline" type="gml:BSplineType" substitutionGroup="gml:AbstractCurveSegment">
		<annotation>
			<documentation>A B-Spline is a piecewise parametric polynomial or rational curve described in terms of control points and basis functions as specified in ISO 19107:2003, 6.4.30. Therefore, interpolation may be either "polynomialSpline" or "rationalSpline" depending on the interpolation type; default is "polynomialSpline".
degree shall be the degree of the polynomial used for interpolation in this spline.
knot shall be the sequence of distinct knots used to define the spline basis functions (see ISO 19107:2003, 6.4.26.2).
The attribute isPolynomial shall be set to "true" if this is a polynomial spline (see ISO 19107:2003, 6.4.30.5).
The attribute knotType shall provide the type of knot distribution used in defining this spline (see ISO 19107:2003, 6.4.30.4).
The content model follows the general pattern for the encoding of curve segments.</documentation>
		</annotation>
	</element>
	<complexType name="KnotType">
		<sequence>
			<element name="value" type="double"/>
			<element name="multiplicity" type="nonNegativeInteger"/>
			<element name="weight" type="double"/>
		</sequence>
	</complexType>
	<complexType name="KnotPropertyType">
		<annotation>
			<documentation>gml:KnotPropertyType encapsulates a knot to use it in a geometric type.</documentation>
		</annotation>
		<sequence>
			<element name="Knot" type="gml:KnotType">
				<annotation>
					<documentation>A knot is a breakpoint on a piecewise spline curve.
value is the value of the parameter at the knot of the spline (see ISO 19107:2003, 6.4.24.2).
multiplicity is the multiplicity of this knot used in the definition of the spline (with the same weight).
weight is the value of the averaging weight used for this knot of the spline.</documentation>
				</annotation>
			</element>
		</sequence>
	</complexType>
	<simpleType name="KnotTypesType">
		<annotation>
			<documentation>This enumeration type specifies values for the knots' type (see ISO 19107:2003, 6.4.25).</documentation>
		</annotation>
		<restriction base="string">
			<enumeration value="uniform"/>
			<enumeration value="quasiUniform"/>
			<enumeration value="piecewiseBezier"/>
		</restriction>
	</simpleType>
	<complexType name="BezierType">
		<complexContent>
			<restriction base="gml:BSplineType">
				<sequence>
					<choice>
						<choice minOccurs="0" maxOccurs="unbounded">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
					<element name="degree" type="nonNegativeInteger"/>
					<element name="knot" type="gml:KnotPropertyType" minOccurs="2" maxOccurs="2"/>
				</sequence>
				<attribute name="interpolation" type="gml:CurveInterpolationType" fixed="polynomialSpline"/>
				<attribute name="isPolynomial" type="boolean" fixed="true"/>
				<attribute name="knotType" type="gml:KnotTypesType" use="prohibited"/>
			</restriction>
		</complexContent>
	</complexType>
	<element name="Bezier" type="gml:BezierType" substitutionGroup="gml:BSpline">
		<annotation>
			<documentation>Bezier curves are polynomial splines that use Bezier or Bernstein polynomials for interpolation purposes. It is a special case of the B-Spline curve with two knots.
degree shall be the degree of the polynomial used for interpolation in this spline.
knot shall be the sequence of distinct knots used to define the spline basis functions.
interpolation is fixed as "polynomialSpline".
isPolynomial is fixed as "true".
knotType is not relevant for Bezier curve segments.
</documentation>
		</annotation>
	</element>
	<complexType name="OffsetCurveType">
		<complexContent>
			<extension base="gml:AbstractCurveSegmentType">
				<sequence>
					<element name="offsetBase" type="gml:CurvePropertyType"/>
					<element name="distance" type="gml:LengthType"/>
					<element name="refDirection" type="gml:VectorType" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="OffsetCurve" type="gml:OffsetCurveType" substitutionGroup="gml:AbstractCurveSegment">
		<annotation>
			<documentation>An offset curve is a curve at a constant distance from the basis curve. offsetBase is the base curve from which this curve is defined as an offset. distance and refDirection have the same meaning as specified in ISO 19107:2003, 6.4.23.
The content model follows the general pattern for the encoding of curve segments.</documentation>
		</annotation>
	</element>
	<complexType name="AffinePlacementType">
		<sequence>
			<element name="location" type="gml:DirectPositionType"/>
			<element name="refDirection" type="gml:VectorType" maxOccurs="unbounded"/>
			<element name="inDimension" type="positiveInteger"/>
			<element name="outDimension" type="positiveInteger"/>
		</sequence>
	</complexType>
	<element name="AffinePlacement" type="gml:AffinePlacementType" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>location, refDirection, inDimension and outDimension have the same meaning as specified in ISO 19107:2003, 6.4.21.</documentation>
		</annotation>
	</element>
	<complexType name="ClothoidType">
		<complexContent>
			<extension base="gml:AbstractCurveSegmentType">
				<sequence>
					<element name="refLocation">
						<complexType>
							<sequence>
								<element ref="gml:AffinePlacement"/>
							</sequence>
						</complexType>
					</element>
					<element name="scaleFactor" type="decimal"/>
					<element name="startParameter" type="double"/>
					<element name="endParameter" type="double"/>
				</sequence>
				<attribute name="interpolation" type="gml:CurveInterpolationType" fixed="clothoid"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="Clothoid" type="gml:ClothoidType" substitutionGroup="gml:AbstractCurveSegment">
		<annotation>
			<documentation>A clothoid, or Cornu's spiral, is plane curve whose curvature is a fixed function of its length.
refLocation, startParameter, endParameter and scaleFactor have the same meaning as specified in ISO 19107:2003, 6.4.22.
interpolation is fixed as "clothoid".
The content model follows the general pattern for the encoding of curve segments.</documentation>
		</annotation>
	</element>
	<complexType name="GeodesicStringType">
		<complexContent>
			<extension base="gml:AbstractCurveSegmentType">
				<choice>
					<element ref="gml:posList"/>
					<group ref="gml:geometricPositionGroup" minOccurs="2" maxOccurs="unbounded"/>
				</choice>
				<attribute name="interpolation" type="gml:CurveInterpolationType" fixed="geodesic"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="GeodesicString" type="gml:GeodesicStringType" substitutionGroup="gml:AbstractCurveSegment">
		<annotation>
			<documentation>A sequence of geodesic segments. 
The number of control points shall be at least two.
interpolation is fixed as "geodesic".
The content model follows the general pattern for the encoding of curve segments.</documentation>
		</annotation>
	</element>
	<complexType name="GeodesicType">
		<complexContent>
			<extension base="gml:GeodesicStringType"/>
		</complexContent>
	</complexType>
	<element name="Geodesic" type="gml:GeodesicType" substitutionGroup="gml:GeodesicString"/>
	<complexType name="SurfaceType">
		<complexContent>
			<extension base="gml:AbstractSurfaceType">
				<sequence>
					<element ref="gml:patches"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="Surface" type="gml:SurfaceType" substitutionGroup="gml:AbstractSurface">
		<annotation>
			<documentation>A Surface is a 2-dimensional primitive and is composed of one or more surface patches as specified in ISO 19107:2003, 6.3.17.1. The surface patches are connected to one another.
patches encapsulates the patches of the surface.</documentation>
		</annotation>
	</element>
	<complexType name="OrientableSurfaceType">
		<complexContent>
			<extension base="gml:AbstractSurfaceType">
				<sequence>
					<element ref="gml:baseSurface"/>
				</sequence>
				<attribute name="orientation" type="gml:SignType" default="+"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="baseSurface" type="gml:SurfacePropertyType">
		<annotation>
			<documentation>The property baseSurface references or contains the base surface. The property baseSurface either references the base surface via the XLink-attributes or contains the surface element. A surface element is any element which is substitutable for gml:AbstractSurface. The base surface has positive orientation.</documentation>
		</annotation>
	</element>
	<element name="OrientableSurface" type="gml:OrientableSurfaceType" substitutionGroup="gml:AbstractSurface">
		<annotation>
			<documentation>OrientableSurface consists of a surface and an orientation. If the orientation is "+", then the OrientableSurface is identical to the baseSurface. If the orientation is "-", then the OrientableSurface is a reference to a gml:AbstractSurface with an up-normal that reverses the direction for this OrientableSurface, the sense of "the top of the surface".</documentation>
		</annotation>
	</element>
	<complexType name="AbstractSurfacePatchType" abstract="true"/>
	<element name="AbstractSurfacePatch" type="gml:AbstractSurfacePatchType" abstract="true">
		<annotation>
			<documentation>A surface patch defines a homogenuous portion of a surface. 
The AbstractSurfacePatch element is the abstract head of the substituition group for all surface patch elements describing a continuous portion of a surface.
All surface patches shall have an attribute interpolation (declared in the types derived from gml:AbstractSurfacePatchType) specifying the interpolation mechanism used for the patch using gml:SurfaceInterpolationType.</documentation>
		</annotation>
	</element>
	<complexType name="SurfacePatchArrayPropertyType">
		<annotation>
			<documentation>gml:SurfacePatchArrayPropertyType is a container for a sequence of surface patches.</documentation>
		</annotation>
		<sequence minOccurs="0" maxOccurs="unbounded">
			<element ref="gml:AbstractSurfacePatch"/>
		</sequence>
	</complexType>
	<element name="patches" type="gml:SurfacePatchArrayPropertyType">
		<annotation>
			<documentation>The patches property element contains the sequence of surface patches. The order of the elements is significant and shall be preserved when processing the array.</documentation>
		</annotation>
	</element>
	<simpleType name="SurfaceInterpolationType">
		<annotation>
			<documentation>gml:SurfaceInterpolationType is a list of codes that may be used to identify the interpolation mechanisms specified by an application schema.</documentation>
		</annotation>
		<restriction base="string">
			<enumeration value="none"/>
			<enumeration value="planar"/>
			<enumeration value="spherical"/>
			<enumeration value="elliptical"/>
			<enumeration value="conic"/>
			<enumeration value="tin"/>
			<enumeration value="parametricCurve"/>
			<enumeration value="polynomialSpline"/>
			<enumeration value="rationalSpline"/>
			<enumeration value="triangulatedSpline"/>
		</restriction>
	</simpleType>
	<complexType name="PolygonPatchType">
		<complexContent>
			<extension base="gml:AbstractSurfacePatchType">
				<sequence>
					<element ref="gml:exterior" minOccurs="0"/>
					<element ref="gml:interior" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
				<attribute name="interpolation" type="gml:SurfaceInterpolationType" fixed="planar"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="PolygonPatch" type="gml:PolygonPatchType" substitutionGroup="gml:AbstractSurfacePatch">
		<annotation>
			<documentation>A gml:PolygonPatch is a surface patch that is defined by a set of boundary curves and an underlying surface to which these curves adhere. The curves shall be coplanar and the polygon uses planar interpolation in its interior. 
interpolation is fixed to "planar", i.e. an interpolation shall return points on a single plane. The boundary of the patch shall be contained within that plane.</documentation>
		</annotation>
	</element>
	<complexType name="TriangleType">
		<complexContent>
			<extension base="gml:AbstractSurfacePatchType">
				<sequence>
					<element ref="gml:exterior"/>
				</sequence>
				<attribute name="interpolation" type="gml:SurfaceInterpolationType" fixed="planar"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="Triangle" type="gml:TriangleType" substitutionGroup="gml:AbstractSurfacePatch">
		<annotation>
			<documentation>gml:Triangle represents a triangle as a surface patch with an outer boundary consisting of a linear ring. Note that this is a polygon (subtype) with no inner boundaries. The number of points in the linear ring shall be four.
The ring (element exterior) shall be a gml:LinearRing and shall form a triangle, the first and the last position shall be coincident.
interpolation is fixed to "planar", i.e. an interpolation shall return points on a single plane. The boundary of the patch shall be contained within that plane.</documentation>
		</annotation>
	</element>
	<complexType name="RectangleType">
		<complexContent>
			<extension base="gml:AbstractSurfacePatchType">
				<sequence>
					<element ref="gml:exterior"/>
				</sequence>
				<attribute name="interpolation" type="gml:SurfaceInterpolationType" fixed="planar"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="Rectangle" type="gml:RectangleType" substitutionGroup="gml:AbstractSurfacePatch">
		<annotation>
			<documentation>gml:Rectangle represents a rectangle as a surface patch with an outer boundary consisting of a linear ring. Note that this is a polygon (subtype) with no inner boundaries. The number of points in the linear ring shall be five.
The ring (element exterior) shall be a gml:LinearRing and shall form a rectangle; the first and the last position shall be coincident.
interpolation is fixed to "planar", i.e. an interpolation shall return points on a single plane. The boundary of the patch shall be contained within that plane.</documentation>
		</annotation>
	</element>
	<complexType name="RingType">
		<complexContent>
			<extension base="gml:AbstractRingType">
				<sequence>
					<element ref="gml:curveMember" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="Ring" type="gml:RingType" substitutionGroup="gml:AbstractRing">
		<annotation>
			<documentation>A ring is used to represent a single connected component of a surface boundary as specified in ISO 19107:2003, 6.3.6.
Every gml:curveMember references or contains one curve, i.e. any element which is substitutable for gml:AbstractCurve. In the context of a ring, the curves describe the boundary of the surface. The sequence of curves shall be contiguous and connected in a cycle.
If provided, the aggregationType attribute shall have the value "sequence".</documentation>
		</annotation>
	</element>
	<element name="curveMember" type="gml:CurvePropertyType"/>
	<complexType name="RingPropertyType">
		<annotation>
			<documentation>A property with the content model of gml:RingPropertyType encapsulates a ring to represent a component of a surface boundary.</documentation>
		</annotation>
		<sequence>
			<element ref="gml:Ring"/>
		</sequence>
	</complexType>
	<group name="PointGrid">
		<annotation>
			<documentation>A gml:PointGrid group contains or references points or positions which are organised into sequences or grids. All rows shall have the same number of positions (columns).</documentation>
		</annotation>
		<sequence>
			<element name="rows">
				<complexType>
					<sequence>
						<element name="Row" maxOccurs="unbounded">
							<complexType>
								<group ref="gml:geometricPositionListGroup"/>
							</complexType>
						</element>
					</sequence>
				</complexType>
			</element>
		</sequence>
	</group>
	<complexType name="AbstractParametricCurveSurfaceType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractSurfacePatchType">
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractParametricCurveSurface" type="gml:AbstractParametricCurveSurfaceType" abstract="true" substitutionGroup="gml:AbstractSurfacePatch">
		<annotation>
			<documentation>The element provides a substitution group head for the surface patches based on parametric curves. All properties are specified in the derived subtypes. All derived subtypes shall conform to the constraints specified in ISO 19107:2003, 6.4.40.
If provided, the aggregationType attribute shall have the value "set".</documentation>
		</annotation>
	</element>
	<complexType name="AbstractGriddedSurfaceType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractParametricCurveSurfaceType">
				<sequence>
					<group ref="gml:PointGrid"/>
				</sequence>
				<attribute name="rows" type="integer"/>
				<attribute name="columns" type="integer"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractGriddedSurface" type="gml:AbstractGriddedSurfaceType" abstract="true" substitutionGroup="gml:AbstractParametricCurveSurface">
		<annotation>
			<documentation>if provided, rows gives the number of rows, columns the number of columns in the parameter grid. The parameter grid is represented by an instance of the gml:PointGrid group.
The element provides a substitution group head for the surface patches based on a grid. All derived subtypes shall conform to the constraints specified in ISO 19107:2003, 6.4.41.</documentation>
		</annotation>
	</element>
	<complexType name="ConeType">
		<complexContent>
			<extension base="gml:AbstractGriddedSurfaceType">
				<attribute name="horizontalCurveType" type="gml:CurveInterpolationType" fixed="circularArc3Points"/>
				<attribute name="verticalCurveType" type="gml:CurveInterpolationType" fixed="linear"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="Cone" type="gml:ConeType" substitutionGroup="gml:AbstractGriddedSurface"/>
	<complexType name="CylinderType">
		<complexContent>
			<extension base="gml:AbstractGriddedSurfaceType">
				<attribute name="horizontalCurveType" type="gml:CurveInterpolationType" fixed="circularArc3Points"/>
				<attribute name="verticalCurveType" type="gml:CurveInterpolationType" fixed="linear"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="Cylinder" type="gml:CylinderType" substitutionGroup="gml:AbstractGriddedSurface"/>
	<complexType name="SphereType">
		<complexContent>
			<extension base="gml:AbstractGriddedSurfaceType">
				<attribute name="horizontalCurveType" type="gml:CurveInterpolationType" fixed="circularArc3Points"/>
				<attribute name="verticalCurveType" type="gml:CurveInterpolationType" fixed="circularArc3Points"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="Sphere" type="gml:SphereType" substitutionGroup="gml:AbstractGriddedSurface"/>
	<element name="PolyhedralSurface" type="gml:SurfaceType" substitutionGroup="gml:Surface">
		<annotation>
			<documentation>A polyhedral surface is a surface composed of polygon patches connected along their common boundary curves. This differs from the surface type only in the restriction on the types of surface patches acceptable.
polygonPatches encapsulates the polygon patches of the polyhedral surface.</documentation>
		</annotation>
	</element>
	<element name="TriangulatedSurface" type="gml:SurfaceType" substitutionGroup="gml:Surface">
		<annotation>
			<documentation>A triangulated surface is a polyhedral surface that is composed only of triangles. There is no restriction on how the triangulation is derived.
trianglePatches encapsulates the triangles of the triangulated surface.</documentation>
		</annotation>
	</element>
	<complexType name="TinType">
		<complexContent>
			<extension base="gml:SurfaceType">
				<sequence>
					<element name="stopLines" type="gml:LineStringSegmentArrayPropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<element name="breakLines" type="gml:LineStringSegmentArrayPropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<element name="maxLength" type="gml:LengthType"/>
					<element name="controlPoint">
						<complexType>
							<choice>
								<element ref="gml:posList"/>
								<group ref="gml:geometricPositionGroup" minOccurs="3" maxOccurs="unbounded"/>
							</choice>
						</complexType>
					</element>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="Tin" type="gml:TinType" substitutionGroup="gml:TriangulatedSurface">
		<annotation>
			<documentation>A tin is a triangulated surface that uses the Delauny algorithm or a similar algorithm complemented with consideration of stoplines (stopLines), breaklines (breakLines), and maximum length of triangle sides (maxLength). controlPoint shall contain a set of the positions (three or more) used as posts for this TIN (corners of the triangles in the TIN). See ISO 19107:2003, 6.4.39 for details.</documentation>
		</annotation>
	</element>
	<complexType name="LineStringSegmentArrayPropertyType">
		<annotation>
			<documentation>gml:LineStringSegmentArrayPropertyType provides a container for line strings.</documentation>
		</annotation>
		<sequence minOccurs="0" maxOccurs="unbounded">
			<element ref="gml:LineStringSegment"/>
		</sequence>
	</complexType>
	<complexType name="AbstractSolidType">
		<annotation>
			<documentation>gml:AbstractSolidType is an abstraction of a solid to support the different levels of complexity. The solid may always be viewed as a geometric primitive, i.e. is contiguous.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractGeometricPrimitiveType"/>
		</complexContent>
	</complexType>
	<element name="AbstractSolid" type="gml:AbstractSolidType" abstract="true" substitutionGroup="gml:AbstractGeometricPrimitive">
		<annotation>
			<documentation>The AbstractSolid element is the abstract head of the substituition group for all (continuous) solid elements.</documentation>
		</annotation>
	</element>
	<complexType name="SolidPropertyType">
		<annotation>
			<documentation>A property that has a solid as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractSolid"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="solidProperty" type="gml:SolidPropertyType">
		<annotation>
			<documentation>This property element either references a solid via the XLink-attributes or contains the solid element. solidProperty is the predefined property which may be used by GML Application Schemas whenever a GML feature has a property with a value that is substitutable for AbstractSolid.</documentation>
		</annotation>
	</element>
	<complexType name="SolidArrayPropertyType">
		<annotation>
			<documentation>gml:SolidArrayPropertyType is a container for an array of solids. The elements are always contained in the array property, referencing geometry elements or arrays of geometry elements is not supported.</documentation>
		</annotation>
		<sequence minOccurs="0" maxOccurs="unbounded">
			<element ref="gml:AbstractSolid"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="SolidType">
		<complexContent>
			<extension base="gml:AbstractSolidType">
				<sequence>
					<element name="exterior" type="gml:ShellPropertyType" minOccurs="0"/>
					<element name="interior" type="gml:ShellPropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="Solid" type="gml:SolidType" substitutionGroup="gml:AbstractSolid">
		<annotation>
			<documentation>A solid is the basis for 3-dimensional geometry. The extent of a solid is defined by the boundary surfaces as specified in ISO 19107:2003, 6.3.18. exterior specifies the outer boundary, interior the inner boundary of the solid.</documentation>
		</annotation>
	</element>
	<complexType name="ShellType">
		<complexContent>
			<extension base="gml:AbstractSurfaceType">
				<sequence>
					<element ref="gml:surfaceMember" maxOccurs="unbounded"/>
				</sequence>
				<attributeGroup ref="gml:AggregationAttributeGroup"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="Shell" type="gml:ShellType" substitutionGroup="gml:AbstractSurface">
		<annotation>
			<documentation>A shell is used to represent a single connected component of a solid boundary as specified in ISO 19107:2003, 6.3.8.
Every gml:surfaceMember references or contains one surface, i.e. any element which is substitutable for gml:AbstractSurface. In the context of a shell, the surfaces describe the boundary of the solid. 
If provided, the aggregationType attribute shall have the value "set".
</documentation>
		</annotation>
	</element>
	<element name="surfaceMember" type="gml:SurfacePropertyType">
		<annotation>
			<documentation>This property element either references a surface via the XLink-attributes or contains the surface element. A surface element is any element, which is substitutable for gml:AbstractSurface.</documentation>
		</annotation>
	</element>
	<complexType name="ShellPropertyType">
		<annotation>
			<documentation>A property with the content model of gml:ShellPropertyType encapsulates a shell to represent a component of a solid boundary.</documentation>
		</annotation>
		<sequence>
			<element ref="gml:Shell"/>
		</sequence>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/referenceSystems.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" xml:lang="en" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:referenceSystems:3.2.2">referenceSystems.xsd</appinfo>
		<documentation>See ISO/DIS 19136 13.2.
The reference systems schema components have two logical parts, which define elements and types for XML encoding of the definitions of:
-	Identified Object, inherited by the ten types of GML objects used for coordinate reference systems and coordinate operations
-	High-level part of the definitions of coordinate reference systems
This schema encodes the Identified Object and Reference System packages of the UML Model for ISO 19111.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="dictionary.xsd"/>
	<import namespace="http://www.isotc211.org/2005/gmd" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gmd/gmd.xsd"/>
	<complexType name="IdentifiedObjectType" abstract="true">
		<annotation>
			<documentation>gml:IdentifiedObjectType provides identification properties of a CRS-related object. In gml:DefinitionType, the gml:identifier element shall be the primary name by which this object is identified, encoding the "name" attribute in the UML model.
Zero or more of the gml:name elements can be an unordered set of "identifiers", encoding the "identifier" attribute in the UML model. Each of these gml:name elements can reference elsewhere the object's defining information or be an identifier by which this object can be referenced.
Zero or more other gml:name elements can be an unordered set of "alias" alternative names by which this CRS related object is identified, encoding the "alias" attributes in the UML model. An object may have several aliases, typically used in different contexts. The context for an alias is indicated by the value of its (optional) codeSpace attribute.
Any needed version information shall be included in the codeSpace attribute of a gml:identifier and gml:name elements. In this use, the gml:remarks element in the gml:DefinitionType shall contain comments on or information about this object, including data source information.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:DefinitionType"/>
		</complexContent>
	</complexType>
	<element name="AbstractCRS" type="gml:AbstractCRSType" abstract="true" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>gml:AbstractCRS specifies a coordinate reference system which is usually single but may be compound. This abstract complex type shall not be used, extended, or restricted, in a GML Application Schema, to define a concrete subtype with a meaning equivalent to a concrete subtype specified in this document.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractCRSType" abstract="true">
		<complexContent>
			<extension base="gml:IdentifiedObjectType">
				<sequence>
					<element ref="gml:domainOfValidity" minOccurs="0" maxOccurs="unbounded"/>
					<element ref="gml:scope" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="domainOfValidity">
		<annotation>
			<documentation>The gml:domainOfValidity property implements an association role to an EX_Extent object as encoded in ISO/TS 19139, either referencing or containing the definition of that extent.</documentation>
		</annotation>
		<complexType>
			<sequence minOccurs="0">
				<element ref="gmd:EX_Extent"/>
			</sequence>
			<attributeGroup ref="gml:AssociationAttributeGroup"/>
		</complexType>
	</element>
	<element name="scope" type="string">
		<annotation>
			<documentation>The gml:scope property provides a description of the usage, or limitations of usage, for which this CRS-related object is valid. If unknown, enter "not known".</documentation>
		</annotation>
	</element>
	<complexType name="CRSPropertyType">
		<annotation>
			<documentation>gml:CRSPropertyType is a property type for association roles to a CRS abstract coordinate reference system, either referencing or containing the definition of that CRS.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractCRS"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/measures.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" attributeFormDefault="unqualified" xml:lang="en" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:measures:3.2.2">measures.xsd</appinfo>
		<documentation>See ISO/DIS 19136 17.3.
gml:MeasureType is defined in the basicTypes schema.  The measure types defined here correspond with a set of convenience measure types described in ISO/TS 19103.  The XML implementation is based on the XML Schema simple type "double" which supports both decimal and scientific notation, and includes an XML attribute "uom" which refers to the units of measure for the value.  Note that, there is no requirement to store values using any particular format, and applications receiving elements of this type may choose to coerce the data to any other type as convenient.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="units.xsd"/>
	<element name="measure" type="gml:MeasureType">
		<annotation>
			<documentation>The value of a physical quantity, together with its unit.</documentation>
		</annotation>
	</element>
	<complexType name="LengthType">
		<annotation>
			<documentation>This is a prototypical definition for a specific measure type defined as a vacuous extension (i.e. aliases) of gml:MeasureType. In this case, the content model supports the description of a length (or distance) quantity, with its units. The unit of measure referenced by uom shall be suitable for a length, such as metres or feet.</documentation>
		</annotation>
		<simpleContent>
			<extension base="gml:MeasureType"/>
		</simpleContent>
	</complexType>
	<complexType name="ScaleType">
		<simpleContent>
			<extension base="gml:MeasureType"/>
		</simpleContent>
	</complexType>
	<complexType name="TimeType">
		<simpleContent>
			<extension base="gml:MeasureType"/>
		</simpleContent>
	</complexType>
	<complexType name="GridLengthType">
		<simpleContent>
			<extension base="gml:MeasureType"/>
		</simpleContent>
	</complexType>
	<complexType name="AreaType">
		<simpleContent>
			<extension base="gml:MeasureType"/>
		</simpleContent>
	</complexType>
	<complexType name="VolumeType">
		<simpleContent>
			<extension base="gml:MeasureType"/>
		</simpleContent>
	</complexType>
	<complexType name="SpeedType">
		<simpleContent>
			<extension base="gml:MeasureType"/>
		</simpleContent>
	</complexType>
	<complexType name="AngleType">
		<simpleContent>
			<extension base="gml:MeasureType"/>
		</simpleContent>
	</complexType>
	<element name="angle" type="gml:AngleType">
		<annotation>
			<documentation>The gml:angle property element is used to record the value of an angle quantity as a single number, with its units.</documentation>
		</annotation>
	</element>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/gmlBase.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:gmlBase:3.2.2">gmlBase.xsd</appinfo>
		<documentation>See ISO/DIS 19136 7.2.
The gmlBase schema components establish the GML model and syntax, in particular
-	a root XML type from which XML types for all GML objects should be derived,
-	a pattern and components for GML properties,
-	patterns for collections and arrays, and components for generic collections and arrays,
-	components for associating metadata with GML objects,
-	components for constructing definitions and dictionaries.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="basicTypes.xsd"/>
	<import namespace="http://www.w3.org/1999/xlink" schemaLocation="http://www.w3.org/1999/xlink.xsd"/>
	<element name="AbstractObject" abstract="true">
		<annotation>
			<documentation>This element has no type defined, and is therefore implicitly (according to the rules of W3C XML Schema) an XML Schema anyType. It is used as the head of an XML Schema substitution group which unifies complex content and certain simple content elements used for datatypes in GML, including the gml:AbstractGML substitution group.</documentation>
		</annotation>
	</element>
	<element name="AbstractGML" type="gml:AbstractGMLType" abstract="true" substitutionGroup="gml:AbstractObject">
		<annotation>
			<documentation>The abstract element gml:AbstractGML is "any GML object having identity".   It acts as the head of an XML Schema substitution group, which may include any element which is a GML feature, or other object, with identity.  This is used as a variable in content models in GML core and application schemas.  It is effectively an abstract superclass for all GML objects.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractGMLType" abstract="true">
		<sequence>
			<group ref="gml:StandardObjectProperties"/>
		</sequence>
		<attribute ref="gml:id"/>
	</complexType>
	<group name="StandardObjectProperties">
		<sequence>
			<element ref="gml:metaDataProperty" minOccurs="0" maxOccurs="unbounded"/>
			<element ref="gml:description" minOccurs="0"/>
			<element ref="gml:descriptionReference" minOccurs="0"/>
			<element ref="gml:identifier" minOccurs="0"/>
			<element ref="gml:name" minOccurs="0" maxOccurs="unbounded"/>
		</sequence>
	</group>
	<attributeGroup name="AssociationAttributeGroup">
		<annotation>
			<documentation>XLink components are the standard method to support hypertext referencing in XML. An XML Schema attribute group, gml:AssociationAttributeGroup, is provided to support the use of Xlinks as the method for indicating the value of a property by reference in a uniform manner in GML.</documentation>
		</annotation>
		<attributeGroup ref="xlink:simpleAttrs"/>
		<attribute name="nilReason" type="gml:NilReasonType"/>
		<attribute ref="gml:remoteSchema">
			<annotation>
				<appinfo>deprecated</appinfo>
			</annotation>
		</attribute>
	</attributeGroup>
	<element name="abstractAssociationRole" type="gml:AssociationRoleType" abstract="true">
		<annotation>
			<documentation>Applying this pattern shall restrict the multiplicity of objects in a property element using this content model to exactly one. An instance of this type shall contain an element representing an object, or serve as a pointer to a remote object.
Applying the pattern to define an application schema specific property type allows to restrict
-	the inline object to specified object types, 
-	the encoding to "by-reference only" (see 7.2.3.7),
-	the encoding to "inline only" (see 7.2.3.8).</documentation>
		</annotation>
	</element>
	<complexType name="AssociationRoleType">
		<sequence minOccurs="0">
			<any namespace="##any"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<attributeGroup name="OwnershipAttributeGroup">
		<annotation>
			<documentation>Encoding a GML property inline vs. by-reference shall not imply anything about the "ownership" of the contained or referenced GML Object, i.e. the encoding style shall not imply any "deep-copy" or "deep-delete" semantics. To express ownership over the contained or referenced GML Object, the gml:OwnershipAttributeGroup attribute group may be added to object-valued property elements. If the attribute group is not part of the content model of such a property element, then the value may not be "owned".
When the value of the owns attribute is "true", the existence of inline or referenced object(s) depends upon the existence of the parent object.</documentation>
		</annotation>
		<attribute name="owns" type="boolean" default="false"/>
	</attributeGroup>
	<element name="abstractStrictAssociationRole" type="gml:AssociationRoleType" abstract="true">
		<annotation>
			<documentation>This element shows how an element 
	declaration may include a Schematron constraint to limit the property to act 
	in either inline or by-reference mode, but not both.</documentation>
		</annotation>
	</element>
	<element name="abstractReference" type="gml:ReferenceType" abstract="true">
		<annotation>
			<documentation>gml:abstractReference may be used as the head of a subtitution group of more specific elements providing a value by-reference.</documentation>
		</annotation>
	</element>
	<complexType name="ReferenceType">
		<annotation>
			<documentation>gml:ReferenceType is intended to be used in application schemas directly, if a property element shall use a "by-reference only" encoding.</documentation>
		</annotation>
		<sequence/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
	</complexType>
	<element name="abstractInlineProperty" type="gml:InlinePropertyType" abstract="true">
		<annotation>
			<documentation>gml:abstractInlineProperty may be used as the head of a subtitution group of more specific elements providing a value inline.</documentation>
		</annotation>
	</element>
	<complexType name="InlinePropertyType">
		<sequence>
			<any namespace="##any"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="reversePropertyName" type="string">
		<annotation>
			<documentation>If the value of an object property is another object and that object contains also a property for the association between the two objects, then this name of the reverse property may be encoded in a gml:reversePropertyName element in an appinfo annotation of the property element to document the constraint between the two properties. The value of the element shall contain the qualified name of the property element.</documentation>
		</annotation>
	</element>
	<element name="description" type="gml:StringOrRefType">
		<annotation>
			<documentation>The value of this property is a text description of the object. gml:description uses gml:StringOrRefType as its content model, so it may contain a simple text string content, or carry a reference to an external description. The use of gml:description to reference an external description has been deprecated and replaced by the gml:descriptionReference property.</documentation>
		</annotation>
	</element>
	<element name="descriptionReference" type="gml:ReferenceType">
		<annotation>
			<documentation>The value of this property is a remote text description of the object. The xlink:href attribute of the gml:descriptionReference property references the external description.</documentation>
		</annotation>
	</element>
	<element name="name" type="gml:CodeType">
		<annotation>
			<documentation>The gml:name property provides a label or identifier for the object, commonly a descriptive name. An object may have several names, typically assigned by different authorities. gml:name uses the gml:CodeType content model.  The authority for a name is indicated by the value of its (optional) codeSpace attribute.  The name may or may not be unique, as determined by the rules of the organization responsible for the codeSpace.  In common usage there will be one name per authority, so a processing application may select the name from its preferred codeSpace.</documentation>
		</annotation>
	</element>
	<element name="identifier" type="gml:CodeWithAuthorityType">
		<annotation>
			<documentation>Often, a special identifier is assigned to an object by the maintaining authority with the intention that it is used in references to the object For such cases, the codeSpace shall be provided. That identifier is usually unique either globally or within an application domain. gml:identifier is a pre-defined property for such identifiers.</documentation>
		</annotation>
	</element>
	<attribute name="id" type="ID">
		<annotation>
			<documentation>The attribute gml:id supports provision of a handle for the XML element representing a GML Object. Its use is mandatory for all GML objects. It is of XML type ID, so is constrained to be unique in the XML document within which it occurs.</documentation>
		</annotation>
	</attribute>
	<complexType name="AbstractMemberType" abstract="true">
		<annotation>
			<documentation>To create a collection of GML Objects that are not all features, a property type shall be derived by extension from gml:AbstractMemberType.
This abstract property type is intended to be used only in object types where software shall be able to identify that an instance of such an object type is to be interpreted as a collection of objects.
By default, this abstract property type does not imply any ownership of the objects in the collection. The owns attribute of gml:OwnershipAttributeGroup may be used on a property element instance to assert ownership of an object in the collection. A collection shall not own an object already owned by another object.
</documentation>
		</annotation>
		<sequence/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<attributeGroup name="AggregationAttributeGroup">
		<annotation>
			<documentation>A GML Object Collection is any GML Object with a property element in its content model whose content model is derived by extension from gml:AbstractMemberType.
In addition, the complex type describing the content model of the GML Object Collection may also include a reference to the attribute group gml:AggregationAttributeGroup to provide additional information about the semantics of the object collection.  This information may be used by applications to group GML objects, and optionally to order and index them.
The allowed values for the aggregationType attribute are defined by gml:AggregationType. See 8.4 of ISO/IEC 11404:1996 for the meaning of the values in the enumeration.</documentation>
		</annotation>
		<attribute name="aggregationType" type="gml:AggregationType"/>
	</attributeGroup>
	<simpleType name="AggregationType" final="#all">
		<restriction base="string">
			<enumeration value="set"/>
			<enumeration value="bag"/>
			<enumeration value="sequence"/>
			<enumeration value="array"/>
			<enumeration value="record"/>
			<enumeration value="table"/>
		</restriction>
	</simpleType>
	<complexType name="AbstractMetadataPropertyType" abstract="true">
		<annotation>
			<documentation>To associate metadata described by any XML Schema with a GML object, a property element shall be defined whose content model is derived by extension from gml:AbstractMetadataPropertyType. 
The value of such a property shall be metadata. The content model of such a property type, i.e. the metadata application schema shall be specified by the GML Application Schema.
By default, this abstract property type does not imply any ownership of the metadata. The owns attribute of gml:OwnershipAttributeGroup may be used on a metadata property element instance to assert ownership of the metadata. 
If metadata following the conceptual model of ISO 19115 is to be encoded in a GML document, the corresponding Implementation Specification specified in ISO/TS 19139 shall be used to encode the metadata information.
</documentation>
		</annotation>
		<sequence/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="targetElement" type="string"/>
	<element name="associationName" type="string"/>
	<element name="defaultCodeSpace" type="anyURI"/>
	<element name="gmlProfileSchema" type="anyURI"/>
</schema>
`],['http://www.w3.org/1999/xlink.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.w3.org/1999/xlink" xmlns:xlink="http://www.w3.org/1999/xlink">
 
 <xs:annotation>
  <xs:documentation>This schema document provides attribute declarations and
attribute group, complex type and simple type definitions which can be used in
the construction of user schemas to define the structure of particular linking
constructs, e.g.
<![CDATA[
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           xmlns:xl="http://www.w3.org/1999/xlink">

 <xs:import namespace="http://www.w3.org/1999/xlink"
            location="http://www.w3.org/1999/xlink.xsd">

 <xs:element name="mySimple">
  <xs:complexType>
   ...
   <xs:attributeGroup ref="xl:simpleAttrs"/>
   ...
  </xs:complexType>
 </xs:element>
 ...
</xs:schema>]]></xs:documentation>
 </xs:annotation>

 <xs:import namespace="http://www.w3.org/XML/1998/namespace" schemaLocation="http://www.w3.org/2001/xml.xsd"/>

 <xs:attribute name="type" type="xlink:typeType"/>

 <xs:simpleType name="typeType">
  <xs:restriction base="xs:token">
   <xs:enumeration value="simple"/>
   <xs:enumeration value="extended"/>
   <xs:enumeration value="title"/>
   <xs:enumeration value="resource"/>
   <xs:enumeration value="locator"/>
   <xs:enumeration value="arc"/>
  </xs:restriction>
 </xs:simpleType>

 <xs:attribute name="href" type="xlink:hrefType"/>

 <xs:simpleType name="hrefType">
  <xs:restriction base="xs:anyURI"/>
 </xs:simpleType>

 <xs:attribute name="role" type="xlink:roleType"/>

 <xs:simpleType name="roleType">
  <xs:restriction base="xs:anyURI">
   <xs:minLength value="1"/>
  </xs:restriction>
 </xs:simpleType>

 <xs:attribute name="arcrole" type="xlink:arcroleType"/>

 <xs:simpleType name="arcroleType">
  <xs:restriction base="xs:anyURI">
   <xs:minLength value="1"/>
  </xs:restriction>
 </xs:simpleType>

 <xs:attribute name="title" type="xlink:titleAttrType"/>

 <xs:simpleType name="titleAttrType">
  <xs:restriction base="xs:string"/>
 </xs:simpleType>

 <xs:attribute name="show" type="xlink:showType"/>

 <xs:simpleType name="showType">
  <xs:restriction base="xs:token">
   <xs:enumeration value="new"/>
   <xs:enumeration value="replace"/>
   <xs:enumeration value="embed"/>
   <xs:enumeration value="other"/>
   <xs:enumeration value="none"/>
  </xs:restriction>
 </xs:simpleType>

 <xs:attribute name="actuate" type="xlink:actuateType"/>

 <xs:simpleType name="actuateType">
  <xs:restriction base="xs:token">
   <xs:enumeration value="onLoad"/>
   <xs:enumeration value="onRequest"/>
   <xs:enumeration value="other"/>
   <xs:enumeration value="none"/>
  </xs:restriction>
 </xs:simpleType>

 <xs:attribute name="label" type="xlink:labelType"/>

 <xs:simpleType name="labelType">
  <xs:restriction base="xs:NCName"/>
 </xs:simpleType>

 <xs:attribute name="from" type="xlink:fromType"/>

 <xs:simpleType name="fromType">
  <xs:restriction base="xs:NCName"/>
 </xs:simpleType>

 <xs:attribute name="to" type="xlink:toType"/>

 <xs:simpleType name="toType">
  <xs:restriction base="xs:NCName"/>
 </xs:simpleType>

 <xs:attributeGroup name="simpleAttrs">
  <xs:attribute ref="xlink:type" fixed="simple"/>
  <xs:attribute ref="xlink:href"/>
  <xs:attribute ref="xlink:role"/>
  <xs:attribute ref="xlink:arcrole"/>
  <xs:attribute ref="xlink:title"/>
  <xs:attribute ref="xlink:show"/>
  <xs:attribute ref="xlink:actuate"/>
 </xs:attributeGroup>

 <xs:group name="simpleModel">
  <xs:sequence>
   <xs:any processContents="lax" minOccurs="0" maxOccurs="unbounded"/>
  </xs:sequence>
 </xs:group>

 <xs:complexType mixed="true" name="simple">
  <xs:annotation>
   <xs:documentation>
    Intended for use as the type of user-declared elements to make them
    simple links.
   </xs:documentation>
  </xs:annotation>
  <xs:group ref="xlink:simpleModel"/>
  <xs:attributeGroup ref="xlink:simpleAttrs"/>
 </xs:complexType>

 <xs:attributeGroup name="extendedAttrs">
  <xs:attribute ref="xlink:type" fixed="extended" use="required"/>
  <xs:attribute ref="xlink:role"/>
  <xs:attribute ref="xlink:title"/>
 </xs:attributeGroup>

 <xs:group name="extendedModel">
   <xs:choice>
    <xs:element ref="xlink:title"/>
    <xs:element ref="xlink:resource"/>
    <xs:element ref="xlink:locator"/>
    <xs:element ref="xlink:arc"/>
  </xs:choice>
 </xs:group>

 <xs:complexType name="extended">
  <xs:annotation>
   <xs:documentation>
    Intended for use as the type of user-declared elements to make them
    extended links.
    Note that the elements referenced in the content model are all abstract.
    The intention is that by simply declaring elements with these as their
    substitutionGroup, all the right things will happen.
   </xs:documentation>
  </xs:annotation>
  <xs:group ref="xlink:extendedModel" minOccurs="0" maxOccurs="unbounded"/>
  <xs:attributeGroup ref="xlink:extendedAttrs"/>
 </xs:complexType>

 <xs:element name="title" type="xlink:titleEltType" abstract="true"/>

 <xs:attributeGroup name="titleAttrs">
  <xs:attribute ref="xlink:type" fixed="title" use="required"/>
  <xs:attribute ref="xml:lang">
   <xs:annotation>
    <xs:documentation>
     xml:lang is not required, but provides much of the
     motivation for title elements in addition to attributes, and so
     is provided here for convenience.
    </xs:documentation>
   </xs:annotation>
  </xs:attribute>
 </xs:attributeGroup>

 <xs:group name="titleModel">
  <xs:sequence>
   <xs:any processContents="lax" minOccurs="0" maxOccurs="unbounded"/>
  </xs:sequence>
 </xs:group>

 <xs:complexType mixed="true" name="titleEltType">
  <xs:group ref="xlink:titleModel"/>
  <xs:attributeGroup ref="xlink:titleAttrs"/>
 </xs:complexType>

 <xs:element name="resource" type="xlink:resourceType" abstract="true"/>

 <xs:attributeGroup name="resourceAttrs">
  <xs:attribute ref="xlink:type" fixed="resource" use="required"/>
  <xs:attribute ref="xlink:role"/>
  <xs:attribute ref="xlink:title"/>
  <xs:attribute ref="xlink:label"/>
 </xs:attributeGroup>

 <xs:group name="resourceModel">
  <xs:sequence>
   <xs:any processContents="lax" minOccurs="0" maxOccurs="unbounded"/>
  </xs:sequence>
 </xs:group>

 <xs:complexType mixed="true" name="resourceType">
  <xs:group ref="xlink:resourceModel"/>
  <xs:attributeGroup ref="xlink:resourceAttrs"/>
 </xs:complexType>

 <xs:element name="locator" type="xlink:locatorType" abstract="true"/>

 <xs:attributeGroup name="locatorAttrs">
  <xs:attribute ref="xlink:type" fixed="locator" use="required"/>
  <xs:attribute ref="xlink:href" use="required"/>
  <xs:attribute ref="xlink:role"/>
  <xs:attribute ref="xlink:title"/>
  <xs:attribute ref="xlink:label">
   <xs:annotation>
    <xs:documentation>
     label is not required, but locators have no particular
     XLink function if they are not labeled.
    </xs:documentation>
   </xs:annotation>
  </xs:attribute>
 </xs:attributeGroup>

 <xs:group name="locatorModel">
  <xs:sequence>
   <xs:element ref="xlink:title" minOccurs="0" maxOccurs="unbounded"/>
  </xs:sequence>
 </xs:group>

 <xs:complexType name="locatorType">
  <xs:group ref="xlink:locatorModel"/>
  <xs:attributeGroup ref="xlink:locatorAttrs"/>
 </xs:complexType>

 <xs:element name="arc" type="xlink:arcType" abstract="true"/>

 <xs:attributeGroup name="arcAttrs">
  <xs:attribute ref="xlink:type" fixed="arc" use="required"/>
  <xs:attribute ref="xlink:arcrole"/>
  <xs:attribute ref="xlink:title"/>
  <xs:attribute ref="xlink:show"/>
  <xs:attribute ref="xlink:actuate"/>
  <xs:attribute ref="xlink:from"/>
  <xs:attribute ref="xlink:to">
   <xs:annotation>
    <xs:documentation>
     from and to have default behavior when values are missing
    </xs:documentation>
   </xs:annotation>
  </xs:attribute>
 </xs:attributeGroup>

 <xs:group name="arcModel">
  <xs:sequence>
   <xs:element ref="xlink:title" minOccurs="0" maxOccurs="unbounded"/>
  </xs:sequence>
 </xs:group>

 <xs:complexType name="arcType">
  <xs:group ref="xlink:arcModel"/>
  <xs:attributeGroup ref="xlink:arcAttrs"/>
 </xs:complexType>

</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gco/gcoBase.xsd',`
<xs:schema xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" targetNamespace="http://www.isotc211.org/2005/gco" elementFormDefault="qualified" attributeFormDefault="unqualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic COmmon (GCO) extensible markup language is a component of the XML Schema Implementation of Geographic
Information Metadata documented in ISO/TS 19139:2007. GCO includes all the definitions of http://www.isotc211.org/2005/gco namespace. The root document of this namespace is the file gco.xsd. This gcoBase.xsd schema provides:
		1.  tools to handle specific objects like "code lists" and "record";
		2. Some XML types representing that do not follow the general encoding rules.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.w3.org/1999/xlink" schemaLocation="http://www.w3.org/1999/xlink.xsd"/>
	<xs:import namespace="http://www.opengis.net/gml/3.2" schemaLocation="http://schemas.opengis.net/gml/3.2.1/gml.xsd"/>
	<xs:include schemaLocation="gco.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- =========================================================================== -->
	<!-- ========================= IM_Object: abstract Root ============================= -->
	<!--================= Type ===================-->
	<xs:complexType name="AbstractObject_Type" abstract="true">
		<xs:sequence/>
		<xs:attributeGroup ref="gco:ObjectIdentification"/>
	</xs:complexType>
	<!--================= Element =================-->
	<xs:element name="AbstractObject" type="gco:AbstractObject_Type" abstract="true"/>
	<!-- ========================================================================== -->
	<!-- ====================== Reference of a resource =============================== -->
	<!--The following attributeGroup 'extends' the GML  gml:AssociationAttributeGroup-->
	<xs:attributeGroup name="ObjectReference">
		<xs:attributeGroup ref="xlink:simpleAttrs"/>
		<xs:attribute name="uuidref" type="xs:string"/>
	</xs:attributeGroup>
	<!--================== NULL ====================-->
	<xs:attribute name="nilReason" type="gml:NilReasonType"/>
	<!--=============== PropertyType =================-->
	<xs:complexType name="ObjectReference_PropertyType">
		<xs:sequence/>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- ========================================================================== -->
	<!-- ====================== Identification of a resource ============================== -->
	<xs:attributeGroup name="ObjectIdentification">
		<xs:attribute name="id" type="xs:ID"/>
		<xs:attribute name="uuid" type="xs:string"/>
	</xs:attributeGroup>
	<!-- ========================================================================== -->
	<!-- ====================== The CodeList prototype ================================= -->
	<!--It is used to refer to a specific codeListValue in a register-->
	<!--================= Type ==================-->
	<xs:complexType name="CodeListValue_Type">
		<xs:simpleContent>
			<xs:extension base="xs:string">
				<xs:attribute name="codeList" type="xs:anyURI" use="required"/>
				<xs:attribute name="codeListValue" type="xs:anyURI" use="required"/>
				<xs:attribute name="codeSpace" type="xs:anyURI"/>
			</xs:extension>
		</xs:simpleContent>
	</xs:complexType>
	<!-- ========================================================================== -->
	<!-- ========================== The isoType attribute ============================== -->
	<xs:attribute name="isoType" type="xs:string"/>
	<!--==============End================-->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gss/gss.xsd',`
<xs:schema targetNamespace="http://www.isotc211.org/2005/gss" elementFormDefault="qualified"  xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gss="http://www.isotc211.org/2005/gss" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic Spatial Schema (GSS) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GSS includes all the definitions of http://www.isotc211.org/2005/gss namespace. The root document of this namespace is the file gss.xsd.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:include schemaLocation="geometry.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/citation.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This citation.xsd schema implements the UML conceptual schema defined in A.3.2 of ISO 19115:2003. It contains the implementation of the following classes: CI_ResponsibleParty, CI_Citation, CI_Address, CI_OnlineResource, CI_Contact, CI_Telephone, URL, CI_Date, CI_Series, CI_RoleCode, CI_PresentationFormCode, CI_OnLineFunctionCode, CI_DateTypeCode.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="referenceSystem.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="CI_ResponsibleParty_Type">
		<xs:annotation>
			<xs:documentation>Identification of, and means of communication with, person(s) and organisations associated with the dataset</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="individualName" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="organisationName" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="positionName" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="contactInfo" type="gmd:CI_Contact_PropertyType" minOccurs="0"/>
					<xs:element name="role" type="gmd:CI_RoleCode_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="CI_ResponsibleParty" type="gmd:CI_ResponsibleParty_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_ResponsibleParty_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_ResponsibleParty"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="CI_Citation_Type">
		<xs:annotation>
			<xs:documentation>Standardized resource reference</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="title" type="gco:CharacterString_PropertyType"/>
					<xs:element name="alternateTitle" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="date" type="gmd:CI_Date_PropertyType" maxOccurs="unbounded"/>
					<xs:element name="edition" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="editionDate" type="gco:Date_PropertyType" minOccurs="0"/>
					<xs:element name="identifier" type="gmd:MD_Identifier_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="citedResponsibleParty" type="gmd:CI_ResponsibleParty_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="presentationForm" type="gmd:CI_PresentationFormCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="series" type="gmd:CI_Series_PropertyType" minOccurs="0"/>
					<xs:element name="otherCitationDetails" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="collectiveTitle" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="ISBN" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="ISSN" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="CI_Citation" type="gmd:CI_Citation_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_Citation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_Citation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="CI_Address_Type">
		<xs:annotation>
			<xs:documentation>Location of the responsible individual or organisation</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="deliveryPoint" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="city" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="administrativeArea" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="postalCode" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="country" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="electronicMailAddress" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="CI_Address" type="gmd:CI_Address_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_Address_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_Address"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="CI_OnlineResource_Type">
		<xs:annotation>
			<xs:documentation>Information about online sources from which the dataset, specification, or community profile name and extended metadata elements can be obtained.</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="linkage" type="gmd:URL_PropertyType"/>
					<xs:element name="protocol" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="applicationProfile" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="name" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="description" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="function" type="gmd:CI_OnLineFunctionCode_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="CI_OnlineResource" type="gmd:CI_OnlineResource_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_OnlineResource_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_OnlineResource"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="CI_Contact_Type">
		<xs:annotation>
			<xs:documentation>Information required enabling contact with the  responsible person and/or organisation</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="phone" type="gmd:CI_Telephone_PropertyType" minOccurs="0"/>
					<xs:element name="address" type="gmd:CI_Address_PropertyType" minOccurs="0"/>
					<xs:element name="onlineResource" type="gmd:CI_OnlineResource_PropertyType" minOccurs="0"/>
					<xs:element name="hoursOfService" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="contactInstructions" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="CI_Contact" type="gmd:CI_Contact_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_Contact_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_Contact"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="CI_Telephone_Type">
		<xs:annotation>
			<xs:documentation>Telephone numbers for contacting the responsible individual or organisation</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="voice" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="facsimile" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="CI_Telephone" type="gmd:CI_Telephone_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_Telephone_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_Telephone"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="CI_Date_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="date" type="gco:Date_PropertyType"/>
					<xs:element name="dateType" type="gmd:CI_DateTypeCode_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="CI_Date" type="gmd:CI_Date_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_Date_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_Date"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="CI_Series_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="name" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="issueIdentification" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="page" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="CI_Series" type="gmd:CI_Series_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_Series_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_Series"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="URL" type="xs:anyURI"/>
	<!-- ........................................................................ -->
	<xs:complexType name="URL_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:URL"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="CI_RoleCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_RoleCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_RoleCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="CI_PresentationFormCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_PresentationFormCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_PresentationFormCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="CI_OnLineFunctionCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_OnLineFunctionCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_OnLineFunctionCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="CI_DateTypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="CI_DateTypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:CI_DateTypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/identification.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This identification.xsd schema implements the UML conceptual schema defined in A.2.2 of ISO 19115:2003. It contains the implementation of the following classes: MD_Identification, MD_BrowseGraphic, MD_DataIdentification, MD_ServiceIdentification, MD_RepresentativeFraction, MD_Usage, MD_Keywords, DS_Association, MD_AggregateInformation, MD_CharacterSetCode, MD_SpatialRepresentationTypeCode, MD_TopicCategoryCode, MD_ProgressCode, MD_KeywordTypeCode, DS_AssociationTypeCode, DS_InitiativeTypeCode, MD_ResolutionType.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="constraints.xsd"/>
	<xs:include schemaLocation="distribution.xsd"/>
	<xs:include schemaLocation="maintenance.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="AbstractMD_Identification_Type" abstract="true">
		<xs:annotation>
			<xs:documentation>Basic information about data</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="citation" type="gmd:CI_Citation_PropertyType"/>
					<xs:element name="abstract" type="gco:CharacterString_PropertyType"/>
					<xs:element name="purpose" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="credit" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="status" type="gmd:MD_ProgressCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="pointOfContact" type="gmd:CI_ResponsibleParty_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="resourceMaintenance" type="gmd:MD_MaintenanceInformation_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="graphicOverview" type="gmd:MD_BrowseGraphic_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="resourceFormat" type="gmd:MD_Format_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="descriptiveKeywords" type="gmd:MD_Keywords_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="resourceSpecificUsage" type="gmd:MD_Usage_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="resourceConstraints" type="gmd:MD_Constraints_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="aggregationInfo" type="gmd:MD_AggregateInformation_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractMD_Identification" type="gmd:AbstractMD_Identification_Type" abstract="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Identification_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractMD_Identification"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_BrowseGraphic_Type">
		<xs:annotation>
			<xs:documentation>Graphic that provides an illustration of the dataset (should include a legend for the graphic)</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="fileName" type="gco:CharacterString_PropertyType"/>
					<xs:element name="fileDescription" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="fileType" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_BrowseGraphic" type="gmd:MD_BrowseGraphic_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_BrowseGraphic_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_BrowseGraphic"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_DataIdentification_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractMD_Identification_Type">
				<xs:sequence>
					<xs:element name="spatialRepresentationType" type="gmd:MD_SpatialRepresentationTypeCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="spatialResolution" type="gmd:MD_Resolution_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="language" type="gco:CharacterString_PropertyType" maxOccurs="unbounded"/>
					<xs:element name="characterSet" type="gmd:MD_CharacterSetCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="topicCategory" type="gmd:MD_TopicCategoryCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="environmentDescription" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="extent" type="gmd:EX_Extent_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="supplementalInformation" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_DataIdentification" type="gmd:MD_DataIdentification_Type" substitutionGroup="gmd:AbstractMD_Identification"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_DataIdentification_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_DataIdentification"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_ServiceIdentification_Type">
		<xs:annotation>
			<xs:documentation>See 19119 for further info</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:AbstractMD_Identification_Type"/>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_ServiceIdentification" type="gmd:MD_ServiceIdentification_Type" substitutionGroup="gmd:AbstractMD_Identification"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ServiceIdentification_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ServiceIdentification"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_RepresentativeFraction_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="denominator" type="gco:Integer_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_RepresentativeFraction" type="gmd:MD_RepresentativeFraction_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_RepresentativeFraction_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_RepresentativeFraction"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Usage_Type">
		<xs:annotation>
			<xs:documentation>Brief description of ways in which the dataset is currently used.</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="specificUsage" type="gco:CharacterString_PropertyType"/>
					<xs:element name="usageDateTime" type="gco:DateTime_PropertyType" minOccurs="0"/>
					<xs:element name="userDeterminedLimitations" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="userContactInfo" type="gmd:CI_ResponsibleParty_PropertyType" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Usage" type="gmd:MD_Usage_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Usage_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Usage"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Keywords_Type">
		<xs:annotation>
			<xs:documentation>Keywords, their type and reference source</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="keyword" type="gco:CharacterString_PropertyType" maxOccurs="unbounded"/>
					<xs:element name="type" type="gmd:MD_KeywordTypeCode_PropertyType" minOccurs="0"/>
					<xs:element name="thesaurusName" type="gmd:CI_Citation_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Keywords" type="gmd:MD_Keywords_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Keywords_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Keywords"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="DS_Association_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence/>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="DS_Association" type="gmd:DS_Association_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_Association_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_Association"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_AggregateInformation_Type">
		<xs:annotation>
			<xs:documentation>Encapsulates the dataset aggregation information</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="aggregateDataSetName" type="gmd:CI_Citation_PropertyType" minOccurs="0"/>
					<xs:element name="aggregateDataSetIdentifier" type="gmd:MD_Identifier_PropertyType" minOccurs="0"/>
					<xs:element name="associationType" type="gmd:DS_AssociationTypeCode_PropertyType"/>
					<xs:element name="initiativeType" type="gmd:DS_InitiativeTypeCode_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_AggregateInformation" type="gmd:MD_AggregateInformation_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_AggregateInformation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_AggregateInformation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Resolution_Type">
		<xs:choice>
			<xs:element name="equivalentScale" type="gmd:MD_RepresentativeFraction_PropertyType"/>
			<xs:element name="distance" type="gco:Distance_PropertyType"/>
		</xs:choice>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Resolution" type="gmd:MD_Resolution_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Resolution_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Resolution"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:simpleType name="MD_TopicCategoryCode_Type">
		<xs:annotation>
			<xs:documentation>High-level geospatial data thematic classification to assist in the grouping and search of available geospatial datasets</xs:documentation>
		</xs:annotation>
		<xs:restriction base="xs:string">
			<xs:enumeration value="farming"/>
			<xs:enumeration value="biota"/>
			<xs:enumeration value="boundaries"/>
			<xs:enumeration value="climatologyMeteorologyAtmosphere"/>
			<xs:enumeration value="economy"/>
			<xs:enumeration value="elevation"/>
			<xs:enumeration value="environment"/>
			<xs:enumeration value="geoscientificInformation"/>
			<xs:enumeration value="health"/>
			<xs:enumeration value="imageryBaseMapsEarthCover"/>
			<xs:enumeration value="intelligenceMilitary"/>
			<xs:enumeration value="inlandWaters"/>
			<xs:enumeration value="location"/>
			<xs:enumeration value="oceans"/>
			<xs:enumeration value="planningCadastre"/>
			<xs:enumeration value="society"/>
			<xs:enumeration value="structure"/>
			<xs:enumeration value="transportation"/>
			<xs:enumeration value="utilitiesCommunication"/>
		</xs:restriction>
	</xs:simpleType>
	<!-- ........................................................................ -->
	<xs:element name="MD_TopicCategoryCode" type="gmd:MD_TopicCategoryCode_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_TopicCategoryCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_TopicCategoryCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_CharacterSetCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_CharacterSetCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_CharacterSetCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_SpatialRepresentationTypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_SpatialRepresentationTypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_SpatialRepresentationTypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_ProgressCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ProgressCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ProgressCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_KeywordTypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_KeywordTypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_KeywordTypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="DS_AssociationTypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_AssociationTypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_AssociationTypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="DS_InitiativeTypeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="DS_InitiativeTypeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:DS_InitiativeTypeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/gml/3.2.1/geometryBasic2d.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:geometryBasic2d:3.2.2">geometryBasic2d.xsd</appinfo>
		<documentation>See ISO/DIS 19136 Clause 10.
			
			GML is an OGC Standard.
			Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
			To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="geometryBasic0d1d.xsd"/>
	<complexType name="AbstractSurfaceType" abstract="true">
		<annotation>
			<documentation>gml:AbstractSurfaceType is an abstraction of a surface to support the different levels of complexity. A surface is always a continuous region of a plane.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:AbstractGeometricPrimitiveType"/>
		</complexContent>
	</complexType>
	<element name="AbstractSurface" type="gml:AbstractSurfaceType" abstract="true" substitutionGroup="gml:AbstractGeometricPrimitive">
		<annotation>
			<documentation>The AbstractSurface element is the abstract head of the substitution group for all (continuous) surface elements.</documentation>
		</annotation>
	</element>
	<complexType name="SurfacePropertyType">
		<annotation>
			<documentation>A property that has a surface as its value domain may either be an appropriate geometry element encapsulated in an element of this type or an XLink reference to a remote geometry element (where remote includes geometry elements located elsewhere in the same document). Either the reference or the contained element shall be given, but neither both nor none.</documentation>
		</annotation>
		<sequence minOccurs="0">
			<element ref="gml:AbstractSurface"/>
		</sequence>
		<attributeGroup ref="gml:AssociationAttributeGroup"/>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<element name="surfaceProperty" type="gml:SurfacePropertyType">
		<annotation>
			<documentation>This property element either references a surface via the XLink-attributes or contains the surface element. surfaceProperty is the predefined property which may be used by GML Application Schemas whenever a GML feature has a property with a value that is substitutable for AbstractSurface.</documentation>
		</annotation>
	</element>
	<complexType name="SurfaceArrayPropertyType">
		<annotation>
			<documentation>gml:SurfaceArrayPropertyType is a container for an array of surfaces. The elements are always contained in the array property, referencing geometry elements or arrays of geometry elements via XLinks is not supported.</documentation>
		</annotation>
		<sequence minOccurs="0" maxOccurs="unbounded">
			<element ref="gml:AbstractSurface"/>
		</sequence>
		<attributeGroup ref="gml:OwnershipAttributeGroup"/>
	</complexType>
	<complexType name="PolygonType">
		<complexContent>
			<extension base="gml:AbstractSurfaceType">
				<sequence>
					<element ref="gml:exterior" minOccurs="0"/>
					<element ref="gml:interior" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="Polygon" type="gml:PolygonType" substitutionGroup="gml:AbstractSurface">
		<annotation>
			<documentation>A Polygon is a special surface that is defined by a single surface patch (see D.3.6). The boundary of this patch is coplanar and the polygon uses planar interpolation in its interior. 
The elements exterior and interior describe the surface boundary of the polygon.</documentation>
		</annotation>
	</element>
	<element name="exterior" type="gml:AbstractRingPropertyType">
		<annotation>
			<documentation>A boundary of a surface consists of a number of rings. In the normal 2D case, one of these rings is distinguished as being the exterior boundary. In a general manifold this is not always possible, in which case all boundaries shall be listed as interior boundaries, and the exterior will be empty.</documentation>
		</annotation>
	</element>
	<element name="interior" type="gml:AbstractRingPropertyType">
		<annotation>
			<documentation>A boundary of a surface consists of a number of rings. The "interior" rings separate the surface / surface patch from the area enclosed by the rings.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractRingType" abstract="true">
		<complexContent>
			<extension base="gml:AbstractCurveType">
				<sequence/>
			</extension>
		</complexContent>
	</complexType>
	<element name="AbstractRing" type="gml:AbstractRingType" abstract="true" substitutionGroup="gml:AbstractCurve">
		<annotation>
			<documentation>An abstraction of a ring to support surface boundaries of different complexity.
The AbstractRing element is the abstract head of the substituition group for all closed boundaries of a surface patch.</documentation>
		</annotation>
	</element>
	<complexType name="AbstractRingPropertyType">
		<annotation>
			<documentation>A property with the content model of gml:AbstractRingPropertyType encapsulates a ring to represent the surface boundary property of a surface.</documentation>
		</annotation>
		<sequence>
			<element ref="gml:AbstractRing"/>
		</sequence>
	</complexType>
	<complexType name="LinearRingType">
		<complexContent>
			<extension base="gml:AbstractRingType">
				<sequence>
					<choice>
						<choice minOccurs="4" maxOccurs="unbounded">
							<element ref="gml:pos"/>
							<element ref="gml:pointProperty"/>
							<element ref="gml:pointRep"/>
						</choice>
						<element ref="gml:posList"/>
						<element ref="gml:coordinates"/>
					</choice>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="LinearRing" type="gml:LinearRingType" substitutionGroup="gml:AbstractRing">
		<annotation>
			<documentation>A LinearRing is defined by four or more coordinate tuples, with linear interpolation between them; the first and last coordinates shall be coincident. The number of direct positions in the list shall be at least four.</documentation>
		</annotation>
	</element>
	<complexType name="LinearRingPropertyType">
		<annotation>
			<documentation>A property with the content model of gml:LinearRingPropertyType encapsulates a linear ring to represent a component of a surface boundary.</documentation>
		</annotation>
		<sequence>
			<element ref="gml:LinearRing"/>
		</sequence>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/units.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml/3.2" elementFormDefault="qualified" xml:lang="en" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:units:3.2.2">units.xsd</appinfo>
		<documentation>See ISO/DIS 17.2.
Several GML Schema components concern or require a reference scale or units of measure.  Units are required for quantities that may occur as values of properties of feature types, as the results of observations, in the range parameters of a coverage, and for measures used in Coordinate Reference System definitions. 
The basic unit definition is an extension of the general gml:Definition element defined in 16.2.1.  Three specialized elements for unit definition are further derived from this. 
This model is based on the SI system of units [ISO 1000], which distinguishes between Base Units and Derived Units.  
-	Base Units are the preferred units for a set of orthogonal fundamental quantities which define the particular system of units, which may not be derived by combination of other base units.  
-	Derived Units are the preferred units for other quantities in the system, which may be defined by algebraic combination of the base units.  
In some application areas Conventional units are used, which may be converted to the preferred units using a scaling factor or a formula which defines a re-scaling and offset.  The set of preferred units for all physical quantity types in a particular system of units is composed of the union of its base units and derived units.  
Unit definitions are substitutable for the gml:Definition element declared as part of the dictionary model.  A dictionary that contains only unit definitions and references to unit definitions is a units dictionary.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<include schemaLocation="dictionary.xsd"/>
	<element name="unitOfMeasure" type="gml:UnitOfMeasureType">
		<annotation>
			<documentation>The element gml:unitOfMeasure is a property element to refer to a unit of measure. This is an empty element which carries a reference to a unit of measure definition.</documentation>
		</annotation>
	</element>
	<complexType name="UnitOfMeasureType">
		<sequence/>
		<attribute name="uom" type="gml:UomIdentifier" use="required"/>
	</complexType>
	<element name="UnitDefinition" type="gml:UnitDefinitionType" substitutionGroup="gml:Definition">
		<annotation>
			<documentation>A gml:UnitDefinition is a general definition of a unit of measure. This generic element is used only for units for which no relationship with other units or units systems is known.
The content model of gml:UnitDefinition adds three additional properties to gml:Definition, gml:quantityType, gml:quantityTypeReference and gml:catalogSymbol.  
The gml:catalogSymbol property optionally gives the short symbol used for this unit. This element is usually used when the relationship of this unit to other units or units systems is unknown.</documentation>
		</annotation>
	</element>
	<complexType name="UnitDefinitionType">
		<complexContent>
			<extension base="gml:DefinitionType">
				<sequence>
					<element ref="gml:quantityType" minOccurs="0"/>
					<element ref="gml:quantityTypeReference" minOccurs="0"/>
					<element ref="gml:catalogSymbol" minOccurs="0"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="quantityType" type="gml:StringOrRefType">
		<annotation>
			<documentation>The gml:quantityType property indicates the phenomenon to which the units apply. This element contains an informal description of the phenomenon or type of physical quantity that is measured or observed. When the physical quantity is the result of an observation or measurement, this term is known as observable type or measurand.
The use of gml:quantityType for references to remote values is deprecated.</documentation>
		</annotation>
	</element>
	<element name="quantityTypeReference" type="gml:ReferenceType">
		<annotation>
			<documentation>The gml:quantityTypeReference property indicates the phenomenon to which the units apply. The content is a reference to a remote value.</documentation>
		</annotation>
	</element>
	<element name="catalogSymbol" type="gml:CodeType">
		<annotation>
			<documentation>The catalogSymbol is the preferred lexical symbol used for this unit of measure.
The codeSpace attribute in gml:CodeType identifies a namespace for the catalog symbol value, and might reference the external catalog. The string value in gml:CodeType contains the value of a symbol that should be unique within this catalog namespace. This symbol often appears explicitly in the catalog, but it could be a combination of symbols using a specified algebra of units.</documentation>
		</annotation>
	</element>
	<element name="BaseUnit" type="gml:BaseUnitType" substitutionGroup="gml:UnitDefinition">
		<annotation>
			<documentation>A base unit is a unit of measure that cannot be derived by combination of other base units within a particular system of units.  For example, in the SI system of units, the base units are metre, kilogram, second, Ampere, Kelvin, mole, and candela, for the physical quantity types length, mass, time interval, electric current, thermodynamic temperature, amount of substance and luminous intensity, respectively.
gml:BaseUnit extends generic gml:UnitDefinition with the property gml:unitsSystem, which carries a reference to the units system to which this base unit is asserted to belong.  </documentation>
		</annotation>
	</element>
	<complexType name="BaseUnitType">
		<complexContent>
			<extension base="gml:UnitDefinitionType">
				<sequence>
					<element name="unitsSystem" type="gml:ReferenceType"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="DerivedUnit" type="gml:DerivedUnitType" substitutionGroup="gml:UnitDefinition">
		<annotation>
			<documentation>Derived units are defined by combination of other units.  Derived units are used for quantities other than those corresponding to the base units, such as hertz (s-1) for frequency, Newton (kg.m/s2) for force.  Derived units based directly on base units are usually preferred for quantities other than the fundamental quantities within a system. If a derived unit is not the preferred unit, the gml:ConventionalUnit element should be used instead.
The gml:DerivedUnit extends gml:UnitDefinition with the property gml:derivationUnitTerms.</documentation>
		</annotation>
	</element>
	<complexType name="DerivedUnitType">
		<complexContent>
			<extension base="gml:UnitDefinitionType">
				<sequence>
					<element ref="gml:derivationUnitTerm" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="derivationUnitTerm" type="gml:DerivationUnitTermType">
		<annotation>
			<documentation>A set of gml:derivationUnitTerm elements describes a derived unit of measure.  Each element carries an integer exponent.  The terms are combined by raising each referenced unit to the power of its exponent and forming the product.
This unit term references another unit of measure (uom) and provides an integer exponent applied to that unit in defining the compound unit. The exponent may be positive or negative, but not zero.</documentation>
		</annotation>
	</element>
	<complexType name="DerivationUnitTermType">
		<complexContent>
			<extension base="gml:UnitOfMeasureType">
				<attribute name="exponent" type="integer"/>
			</extension>
		</complexContent>
	</complexType>
	<element name="ConventionalUnit" type="gml:ConventionalUnitType" substitutionGroup="gml:UnitDefinition">
		<annotation>
			<documentation>Conventional units that are neither base units nor defined by direct combination of base units are used in many application domains.  For example electronVolt for energy, feet and nautical miles for length.  In most cases there is a known, usually linear, conversion to a preferred unit which is either a base unit or derived by direct combination of base units.
The gml:ConventionalUnit extends gml:UnitDefinition with a property that describes a conversion to a preferred unit for this physical quantity.  When the conversion is exact, the element gml:conversionToPreferredUnit should be used, or when the conversion is not exact the element gml:roughConversionToPreferredUnit is available. Both of these elements have the same content model.  The gml:derivationUnitTerm property defined above is included to allow a user to optionally record how this unit may be derived from other ("more primitive") units.</documentation>
		</annotation>
	</element>
	<complexType name="ConventionalUnitType">
		<complexContent>
			<extension base="gml:UnitDefinitionType">
				<sequence>
					<choice>
						<element ref="gml:conversionToPreferredUnit"/>
						<element ref="gml:roughConversionToPreferredUnit"/>
					</choice>
					<element ref="gml:derivationUnitTerm" minOccurs="0" maxOccurs="unbounded"/>
				</sequence>
			</extension>
		</complexContent>
	</complexType>
	<element name="conversionToPreferredUnit" type="gml:ConversionToPreferredUnitType">
		<annotation>
			<documentation>The elements gml:conversionToPreferredUnit and gml:roughConversionToPreferredUnit represent parameters used to convert conventional units to preferred units for this physical quantity type.  A preferred unit is either a Base Unit or a Derived Unit that is selected for all values of one physical quantity type.</documentation>
		</annotation>
	</element>
	<element name="roughConversionToPreferredUnit" type="gml:ConversionToPreferredUnitType">
		<annotation>
			<documentation>The elements gml:conversionToPreferredUnit and gml:roughConversionToPreferredUnit represent parameters used to convert conventional units to preferred units for this physical quantity type.  A preferred unit is either a Base Unit or a Derived Unit that is selected for all values of one physical quantity type.</documentation>
		</annotation>
	</element>
	<complexType name="ConversionToPreferredUnitType">
		<annotation>
			<documentation>The inherited attribute uom references the preferred unit that this conversion applies to. The conversion of a unit to the preferred unit for this physical quantity type is specified by an arithmetic conversion (scaling and/or offset). The content model extends gml:UnitOfMeasureType, which has a mandatory attribute uom which identifies the preferred unit for the physical quantity type that this conversion applies to. The conversion is specified by a choice of 
-	gml:factor, which defines the scale factor, or
-	gml:formula, which defines a formula 
by which a value using the conventional unit of measure can be converted to obtain the corresponding value using the preferred unit of measure.  
The formula defines the parameters of a simple formula by which a value using the conventional unit of measure can be converted to the corresponding value using the preferred unit of measure. The formula element contains elements a, b, c and d, whose values use the XML Schema type double. These values are used in the formula y = (a + bx) / (c + dx), where x is a value using this unit, and y is the corresponding value using the base unit. The elements a and d are optional, and if values are not provided, those parameters are considered to be zero. If values are not provided for both a and d, the formula is equivalent to a fraction with numerator and denominator parameters.</documentation>
		</annotation>
		<complexContent>
			<extension base="gml:UnitOfMeasureType">
				<choice>
					<element name="factor" type="double"/>
					<element name="formula" type="gml:FormulaType"/>
				</choice>
			</extension>
		</complexContent>
	</complexType>
	<complexType name="FormulaType">
		<sequence>
			<element name="a" type="double" minOccurs="0"/>
			<element name="b" type="double"/>
			<element name="c" type="double"/>
			<element name="d" type="double" minOccurs="0"/>
		</sequence>
	</complexType>
</schema>
`],['http://schemas.opengis.net/gml/3.2.1/basicTypes.xsd',`
<schema targetNamespace="http://www.opengis.net/gml/3.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" version="3.2.2">
	<annotation>
		<appinfo source="urn:x-ogc:specification:gml:schema-xsd:basicTypes:3.2.2">basicTypes.xsd</appinfo>
		<documentation>See ISO/DIS 19136 8.2.
W3C XML Schema provides a set of built-in "simple" types which define methods for representing values as literals without internal markup.  These are described in W3C XML Schema Part 2:2001.  Because GML is an XML encoding in which instances are described using XML Schema, these simple types shall be used as far as possible and practical for the representation of data types.  W3C XML Schema also provides methods for defining 
-	new simple types by restriction and combination of the built-in types, and 
-	complex types, with simple content, but which also have XML attributes.  
In many places where a suitable built-in simple type is not available, simple content types derived using the XML Schema mechanisms are used for the representation of data types in GML.  
A set of these simple content types that are required by several GML components are defined in the basicTypes schema, as well as some elements based on them. These are primarily based around components needed to record amounts, counts, flags and terms, together with support for exceptions or null values.

GML is an OGC Standard.
Copyright (c) 2007, 2010, 2016, 2018 Open Geospatial Consortium.
To obtain additional rights of use, visit http://www.opengeospatial.org/legal/ .
		</documentation>
	</annotation>
	<include schemaLocation="gml.xsd"/>
	<simpleType name="NilReasonType">
		<annotation>
			<documentation>gml:NilReasonType defines a content model that allows recording of an explanation for a void value or other exception.
gml:NilReasonType is a union of the following enumerated values:
-	inapplicable there is no value
-	missing the correct value is not readily available to the sender of this data. Furthermore, a correct value may not exist
-	template the value will be available later
-	unknown the correct value is not known to, and not computable by, the sender of this data. However, a correct value probably exists
-	withheld the value is not divulged
-	other:text other brief explanation, where text is a string of two or more characters with no included spaces
and
-	anyURI which should refer to a resource which describes the reason for the exception
A particular community may choose to assign more detailed semantics to the standard values provided. Alternatively, the URI method enables a specific or more complete explanation for the absence of a value to be provided elsewhere and indicated by-reference in an instance document.
gml:NilReasonType is used as a member of a union in a number of simple content types where it is necessary to permit a value from the NilReasonType union as an alternative to the primary type.</documentation>
		</annotation>
		<union memberTypes="gml:NilReasonEnumeration anyURI"/>
	</simpleType>
	<simpleType name="NilReasonEnumeration">
		<union>
			<simpleType>
				<restriction base="string">
					<enumeration value="inapplicable"/>
					<enumeration value="missing"/>
					<enumeration value="template"/>
					<enumeration value="unknown"/>
					<enumeration value="withheld"/>
				</restriction>
			</simpleType>
			<simpleType>
				<restriction base="string">
					<pattern value="other:\w{2,}"/>
				</restriction>
			</simpleType>
		</union>
	</simpleType>
	<simpleType name="SignType">
		<annotation>
			<documentation>gml:SignType is a convenience type with values "+" (plus) and "-" (minus).</documentation>
		</annotation>
		<restriction base="string">
			<enumeration value="-"/>
			<enumeration value="+"/>
		</restriction>
	</simpleType>
	<simpleType name="booleanOrNilReason">
		<annotation>
			<documentation>Extension to the respective XML Schema built-in simple type to allow a choice of either a value of the built-in simple type or a reason for a nil value.</documentation>
		</annotation>
		<union memberTypes="gml:NilReasonEnumeration boolean anyURI"/>
	</simpleType>
	<simpleType name="doubleOrNilReason">
		<annotation>
			<documentation>Extension to the respective XML Schema built-in simple type to allow a choice of either a value of the built-in simple type or a reason for a nil value.</documentation>
		</annotation>
		<union memberTypes="gml:NilReasonEnumeration double anyURI"/>
	</simpleType>
	<simpleType name="integerOrNilReason">
		<annotation>
			<documentation>Extension to the respective XML Schema built-in simple type to allow a choice of either a value of the built-in simple type or a reason for a nil value.</documentation>
		</annotation>
		<union memberTypes="gml:NilReasonEnumeration integer anyURI"/>
	</simpleType>
	<simpleType name="NameOrNilReason">
		<annotation>
			<documentation>Extension to the respective XML Schema built-in simple type to allow a choice of either a value of the built-in simple type or a reason for a nil value.</documentation>
		</annotation>
		<union memberTypes="gml:NilReasonEnumeration Name anyURI"/>
	</simpleType>
	<simpleType name="stringOrNilReason">
		<annotation>
			<documentation>Extension to the respective XML Schema built-in simple type to allow a choice of either a value of the built-in simple type or a reason for a nil value.</documentation>
		</annotation>
		<union memberTypes="gml:NilReasonEnumeration string anyURI"/>
	</simpleType>
	<complexType name="CodeType">
		<annotation>
			<documentation>gml:CodeType is a generalized type to be used for a term, keyword or name.
It adds a XML attribute codeSpace to a term, where the value of the codeSpace attribute (if present) shall indicate a dictionary, thesaurus, classification scheme, authority, or pattern for the term.</documentation>
		</annotation>
		<simpleContent>
			<extension base="string">
				<attribute name="codeSpace" type="anyURI"/>
			</extension>
		</simpleContent>
	</complexType>
	<complexType name="CodeWithAuthorityType">
		<annotation>
			<documentation>gml:CodeWithAuthorityType requires that the codeSpace attribute is provided in an instance.</documentation>
		</annotation>
		<simpleContent>
			<restriction base="gml:CodeType">
				<attribute name="codeSpace" type="anyURI" use="required"/>
			</restriction>
		</simpleContent>
	</complexType>
	<complexType name="MeasureType">
		<annotation>
			<documentation>gml:MeasureType supports recording an amount encoded as a value of XML Schema double, together with a units of measure indicated by an attribute uom, short for "units Of measure". The value of the uom attribute identifies a reference system for the amount, usually a ratio or interval scale.</documentation>
		</annotation>
		<simpleContent>
			<extension base="double">
				<attribute name="uom" type="gml:UomIdentifier" use="required"/>
			</extension>
		</simpleContent>
	</complexType>
	<simpleType name="UomIdentifier">
		<annotation>
			<documentation>The simple type gml:UomIdentifer defines the syntax and value space of the unit of measure identifier.</documentation>
		</annotation>
		<union memberTypes="gml:UomSymbol gml:UomURI"/>
	</simpleType>
	<simpleType name="UomSymbol">
		<annotation>
			<documentation>This type specifies a character string of length at least one, and restricted such that it must not contain any of the following characters: ":" (colon), " " (space), (newline), (carriage return), (tab). This allows values corresponding to familiar abbreviations, such as "kg", "m/s", etc. 
It is recommended that the symbol be an identifier for a unit of measure as specified in the "Unified Code of Units of Measure" (UCUM) (http://aurora.regenstrief.org/UCUM). This provides a set of symbols and a grammar for constructing identifiers for units of measure that are unique, and may be easily entered with a keyboard supporting the limited character set known as 7-bit ASCII. ISO 2955 formerly provided a specification with this scope, but was withdrawn in 2001. UCUM largely follows ISO 2955 with modifications to remove ambiguities and other problems.</documentation>
		</annotation>
		<restriction base="string">
			<pattern value="[^: \n\r\t]+"/>
		</restriction>
	</simpleType>
	<simpleType name="UomURI">
		<annotation>
			<documentation>This type specifies a URI, restricted such that it must start with one of the following sequences: "#", "./", "../", or a string of characters followed by a ":". These patterns ensure that the most common URI forms are supported, including absolute and relative URIs and URIs that are simple fragment identifiers, but prohibits certain forms of relative URI that could be mistaken for unit of measure symbol . 
NOTE	It is possible to re-write such a relative URI to conform to the restriction (e.g. "./m/s").
In an instance document, on elements of type gml:MeasureType the mandatory uom attribute shall carry a value corresponding to either 
-	a conventional unit of measure symbol,
-	a link to a definition of a unit of measure that does not have a conventional symbol, or when it is desired to indicate a precise or variant definition.</documentation>
		</annotation>
		<restriction base="anyURI">
			<pattern value="([a-zA-Z][a-zA-Z0-9\-\+\.]*:|\.\./|\./|#).*"/>
		</restriction>
	</simpleType>
	<complexType name="CoordinatesType">
		<annotation>
			<documentation>This type is deprecated for tuples with ordinate values that are numbers.
CoordinatesType is a text string, intended to be used to record an array of tuples or coordinates. 
While it is not possible to enforce the internal structure of the string through schema validation, some optional attributes have been provided in previous versions of GML to support a description of the internal structure. These attributes are deprecated. The attributes were intended to be used as follows:
Decimal	symbol used for a decimal point (default="." a stop or period)
cs        	symbol used to separate components within a tuple or coordinate string (default="," a comma)
ts        	symbol used to separate tuples or coordinate strings (default=" " a space)
Since it is based on the XML Schema string type, CoordinatesType may be used in the construction of tables of tuples or arrays of tuples, including ones that contain mixed text and numeric values.</documentation>
		</annotation>
		<simpleContent>
			<extension base="string">
				<attribute name="decimal" type="string" default="."/>
				<attribute name="cs" type="string" default=","/>
				<attribute name="ts" type="string" default="&#x20;"/>
			</extension>
		</simpleContent>
	</complexType>
	<simpleType name="booleanList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="boolean"/>
	</simpleType>
	<simpleType name="doubleList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="double"/>
	</simpleType>
	<simpleType name="integerList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="integer"/>
	</simpleType>
	<simpleType name="NameList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="Name"/>
	</simpleType>
	<simpleType name="NCNameList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="NCName"/>
	</simpleType>
	<simpleType name="QNameList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="QName"/>
	</simpleType>
	<simpleType name="booleanOrNilReasonList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="gml:booleanOrNilReason"/>
	</simpleType>
	<simpleType name="NameOrNilReasonList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="gml:NameOrNilReason"/>
	</simpleType>
	<simpleType name="doubleOrNilReasonList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="gml:doubleOrNilReason"/>
	</simpleType>
	<simpleType name="integerOrNilReasonList">
		<annotation>
			<documentation>A type for a list of values of the respective simple type.</documentation>
		</annotation>
		<list itemType="gml:integerOrNilReason"/>
	</simpleType>
	<complexType name="CodeListType">
		<annotation>
			<documentation>gml:CodeListType provides for lists of terms. The values in an instance element shall all be valid according to the rules of the dictionary, classification scheme, or authority identified by the value of its codeSpace attribute.</documentation>
		</annotation>
		<simpleContent>
			<extension base="gml:NameList">
				<attribute name="codeSpace" type="anyURI"/>
			</extension>
		</simpleContent>
	</complexType>
	<complexType name="CodeOrNilReasonListType">
		<annotation>
			<documentation>gml:CodeOrNilReasonListType provides for lists of terms. The values in an instance element shall all be valid according to the rules of the dictionary, classification scheme, or authority identified by the value of its codeSpace attribute. An instance element may also include embedded values from NilReasonType. It is intended to be used in situations where a term or classification is expected, but the value may be absent for some reason.</documentation>
		</annotation>
		<simpleContent>
			<extension base="gml:NameOrNilReasonList">
				<attribute name="codeSpace" type="anyURI"/>
			</extension>
		</simpleContent>
	</complexType>
	<complexType name="MeasureListType">
		<annotation>
			<documentation>gml:MeasureListType provides for a list of quantities.</documentation>
		</annotation>
		<simpleContent>
			<extension base="gml:doubleList">
				<attribute name="uom" type="gml:UomIdentifier" use="required"/>
			</extension>
		</simpleContent>
	</complexType>
	<complexType name="MeasureOrNilReasonListType">
		<annotation>
			<documentation>gml:MeasureOrNilReasonListType provides for a list of quantities. An instance element may also include embedded values from NilReasonType. It is intended to be used in situations where a value is expected, but the value may be absent for some reason.</documentation>
		</annotation>
		<simpleContent>
			<extension base="gml:doubleOrNilReasonList">
				<attribute name="uom" type="gml:UomIdentifier" use="required"/>
			</extension>
		</simpleContent>
	</complexType>
</schema>
`],['http://www.w3.org/2001/xml.xsd',`
<?xml-stylesheet href="../2008/09/xsd.xsl" type="text/xsl"?>
<xs:schema targetNamespace="http://www.w3.org/XML/1998/namespace" 
  xmlns:xs="http://www.w3.org/2001/XMLSchema" 
  xmlns   ="http://www.w3.org/1999/xhtml"
  xml:lang="en">

 <xs:annotation>
  <xs:documentation>
   <div>
    <h1>About the XML namespace</h1>

    <div class="bodytext">
     <p>
      This schema document describes the XML namespace, in a form
      suitable for import by other schema documents.
     </p>
     <p>
      See <a href="http://www.w3.org/XML/1998/namespace.html">
      http://www.w3.org/XML/1998/namespace.html</a> and
      <a href="http://www.w3.org/TR/REC-xml">
      http://www.w3.org/TR/REC-xml</a> for information 
      about this namespace.
     </p>
     <p>
      Note that local names in this namespace are intended to be
      defined only by the World Wide Web Consortium or its subgroups.
      The names currently defined in this namespace are listed below.
      They should not be used with conflicting semantics by any Working
      Group, specification, or document instance.
     </p>
     <p>   
      See further below in this document for more information about <a
      href="#usage">how to refer to this schema document from your own
      XSD schema documents</a> and about <a href="#nsversioning">the
      namespace-versioning policy governing this schema document</a>.
     </p>
    </div>
   </div>
  </xs:documentation>
 </xs:annotation>

 <xs:attribute name="lang">
  <xs:annotation>
   <xs:documentation>
    <div>
     
      <h3>lang (as an attribute name)</h3>
      <p>
       denotes an attribute whose value
       is a language code for the natural language of the content of
       any element; its value is inherited.  This name is reserved
       by virtue of its definition in the XML specification.</p>
     
    </div>
    <div>
     <h4>Notes</h4>
     <p>
      Attempting to install the relevant ISO 2- and 3-letter
      codes as the enumerated possible values is probably never
      going to be a realistic possibility.  
     </p>
     <p>
      See BCP 47 at <a href="http://www.rfc-editor.org/rfc/bcp/bcp47.txt">
       http://www.rfc-editor.org/rfc/bcp/bcp47.txt</a>
      and the IANA language subtag registry at
      <a href="http://www.iana.org/assignments/language-subtag-registry">
       http://www.iana.org/assignments/language-subtag-registry</a>
      for further information.
     </p>
     <p>
      The union allows for the 'un-declaration' of xml:lang with
      the empty string.
     </p>
    </div>
   </xs:documentation>
  </xs:annotation>
  <xs:simpleType>
   <xs:union memberTypes="xs:language">
    <xs:simpleType>    
     <xs:restriction base="xs:string">
      <xs:enumeration value=""/>
     </xs:restriction>
    </xs:simpleType>
   </xs:union>
  </xs:simpleType>
 </xs:attribute>

 <xs:attribute name="space">
  <xs:annotation>
   <xs:documentation>
    <div>
     
      <h3>space (as an attribute name)</h3>
      <p>
       denotes an attribute whose
       value is a keyword indicating what whitespace processing
       discipline is intended for the content of the element; its
       value is inherited.  This name is reserved by virtue of its
       definition in the XML specification.</p>
     
    </div>
   </xs:documentation>
  </xs:annotation>
  <xs:simpleType>
   <xs:restriction base="xs:NCName">
    <xs:enumeration value="default"/>
    <xs:enumeration value="preserve"/>
   </xs:restriction>
  </xs:simpleType>
 </xs:attribute>
 
 <xs:attribute name="base" type="xs:anyURI"> <xs:annotation>
   <xs:documentation>
    <div>
     
      <h3>base (as an attribute name)</h3>
      <p>
       denotes an attribute whose value
       provides a URI to be used as the base for interpreting any
       relative URIs in the scope of the element on which it
       appears; its value is inherited.  This name is reserved
       by virtue of its definition in the XML Base specification.</p>
     
     <p>
      See <a
      href="http://www.w3.org/TR/xmlbase/">http://www.w3.org/TR/xmlbase/</a>
      for information about this attribute.
     </p>
    </div>
   </xs:documentation>
  </xs:annotation>
 </xs:attribute>
 
 <xs:attribute name="id" type="xs:ID">
  <xs:annotation>
   <xs:documentation>
    <div>
     
      <h3>id (as an attribute name)</h3> 
      <p>
       denotes an attribute whose value
       should be interpreted as if declared to be of type ID.
       This name is reserved by virtue of its definition in the
       xml:id specification.</p>
     
     <p>
      See <a
      href="http://www.w3.org/TR/xml-id/">http://www.w3.org/TR/xml-id/</a>
      for information about this attribute.
     </p>
    </div>
   </xs:documentation>
  </xs:annotation>
 </xs:attribute>

 <xs:attributeGroup name="specialAttrs">
  <xs:attribute ref="xml:base"/>
  <xs:attribute ref="xml:lang"/>
  <xs:attribute ref="xml:space"/>
  <xs:attribute ref="xml:id"/>
 </xs:attributeGroup>

 <xs:annotation>
  <xs:documentation>
   <div>
   
    <h3>Father (in any context at all)</h3> 

    <div class="bodytext">
     <p>
      denotes Jon Bosak, the chair of 
      the original XML Working Group.  This name is reserved by 
      the following decision of the W3C XML Plenary and 
      XML Coordination groups:
     </p>
     <blockquote>
       <p>
	In appreciation for his vision, leadership and
	dedication the W3C XML Plenary on this 10th day of
	February, 2000, reserves for Jon Bosak in perpetuity
	the XML name "xml:Father".
       </p>
     </blockquote>
    </div>
   </div>
  </xs:documentation>
 </xs:annotation>

 <xs:annotation>
  <xs:documentation>
   <div xml:id="usage" id="usage">
    <h2><a name="usage">About this schema document</a></h2>

    <div class="bodytext">
     <p>
      This schema defines attributes and an attribute group suitable
      for use by schemas wishing to allow <code>xml:base</code>,
      <code>xml:lang</code>, <code>xml:space</code> or
      <code>xml:id</code> attributes on elements they define.
     </p>
     <p>
      To enable this, such a schema must import this schema for
      the XML namespace, e.g. as follows:
     </p>
     <pre>
          &lt;schema . . .>
           . . .
           &lt;import namespace="http://www.w3.org/XML/1998/namespace"
                      schemaLocation="http://www.w3.org/2001/xml.xsd"/>
     </pre>
     <p>
      or
     </p>
     <pre>
           &lt;import namespace="http://www.w3.org/XML/1998/namespace"
                      schemaLocation="http://www.w3.org/2009/01/xml.xsd"/>
     </pre>
     <p>
      Subsequently, qualified reference to any of the attributes or the
      group defined below will have the desired effect, e.g.
     </p>
     <pre>
          &lt;type . . .>
           . . .
           &lt;attributeGroup ref="xml:specialAttrs"/>
     </pre>
     <p>
      will define a type which will schema-validate an instance element
      with any of those attributes.
     </p>
    </div>
   </div>
  </xs:documentation>
 </xs:annotation>

 <xs:annotation>
  <xs:documentation>
   <div id="nsversioning" xml:id="nsversioning">
    <h2><a name="nsversioning">Versioning policy for this schema document</a></h2>
    <div class="bodytext">
     <p>
      In keeping with the XML Schema WG's standard versioning
      policy, this schema document will persist at
      <a href="http://www.w3.org/2009/01/xml.xsd">
       http://www.w3.org/2009/01/xml.xsd</a>.
     </p>
     <p>
      At the date of issue it can also be found at
      <a href="http://www.w3.org/2001/xml.xsd">
       http://www.w3.org/2001/xml.xsd</a>.
     </p>
     <p>
      The schema document at that URI may however change in the future,
      in order to remain compatible with the latest version of XML
      Schema itself, or with the XML namespace itself.  In other words,
      if the XML Schema or XML namespaces change, the version of this
      document at <a href="http://www.w3.org/2001/xml.xsd">
       http://www.w3.org/2001/xml.xsd 
      </a> 
      will change accordingly; the version at 
      <a href="http://www.w3.org/2009/01/xml.xsd">
       http://www.w3.org/2009/01/xml.xsd 
      </a> 
      will not change.
     </p>
     <p>
      Previous dated (and unchanging) versions of this schema 
      document are at:
     </p>
     <ul>
      <li><a href="http://www.w3.org/2009/01/xml.xsd">
	http://www.w3.org/2009/01/xml.xsd</a></li>
      <li><a href="http://www.w3.org/2007/08/xml.xsd">
	http://www.w3.org/2007/08/xml.xsd</a></li>
      <li><a href="http://www.w3.org/2004/10/xml.xsd">
	http://www.w3.org/2004/10/xml.xsd</a></li>
      <li><a href="http://www.w3.org/2001/03/xml.xsd">
	http://www.w3.org/2001/03/xml.xsd</a></li>
     </ul>
    </div>
   </div>
  </xs:documentation>
 </xs:annotation>

</xs:schema>

`],['http://schemas.opengis.net/iso/19139/20070417/gss/geometry.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gss="http://www.isotc211.org/2005/gss" targetNamespace="http://www.isotc211.org/2005/gss" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic Spatial Schema (GSS) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GSS includes all the definitions of http://www.isotc211.org/2005/gss namespace. The root document of this namespace is the file gss.xsd. This geometry.xsd schema contains the implementation of GM_Object and GM_Point. The encoding of these classes is mapped to ISO 19136 geometric types.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.opengis.net/gml/3.2" schemaLocation="http://schemas.opengis.net/gml/3.2.1/gml.xsd"/>
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gss.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<!-- ........................................................................ -->
	<!--==XCGE: gml:Point==-->
	<!-- ........................................................................ -->
	<xs:complexType name="GM_Point_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:Point"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<!--==XCGE: gml:AbstractGeometry==-->
	<!-- ........................................................................ -->
	<xs:complexType name="GM_Object_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:AbstractGeometry"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/referenceSystem.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This referenceSystem.xsd schema implements the UML conceptual schema defined in A.2.7 of ISO 19115:2003 and ISO 19115:2003/Cor. 1:2006. It contains the implementation of the following classes: RS_Identifier, MD_ReferenceSystem, MD_Identifier and RS_Reference System.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="citation.xsd"/>
	<xs:include schemaLocation="extent.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="RS_Identifier_Type">
		<xs:complexContent>
			<xs:extension base="gmd:MD_Identifier_Type">
				<xs:sequence>
					<xs:element name="codeSpace" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="version" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="RS_Identifier" type="gmd:RS_Identifier_Type" substitutionGroup="gmd:MD_Identifier"/>
	<!-- ........................................................................ -->
	<xs:complexType name="RS_Identifier_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:RS_Identifier"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_ReferenceSystem_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="referenceSystemIdentifier" type="gmd:RS_Identifier_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_ReferenceSystem" type="gmd:MD_ReferenceSystem_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ReferenceSystem_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ReferenceSystem"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Identifier_Type">
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="authority" type="gmd:CI_Citation_PropertyType" minOccurs="0"/>
					<xs:element name="code" type="gco:CharacterString_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Identifier" type="gmd:MD_Identifier_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Identifier_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Identifier"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractRS_ReferenceSystem_Type" abstract="true">
		<xs:annotation>
			<xs:documentation>Description of the spatial and temporal reference systems used in the dataset</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="name" type="gmd:RS_Identifier_PropertyType"/>
					<xs:element name="domainOfValidity" type="gmd:EX_Extent_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractRS_ReferenceSystem" type="gmd:AbstractRS_ReferenceSystem_Type" abstract="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="RS_ReferenceSystem_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractRS_ReferenceSystem"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/constraints.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This constraints.xsd schema implements the UML conceptual schema defined in A.2.3 of ISO 19115:2003. It contains the implementation of the following classes: MD_Constraints, MD_LegalConstraints, MD_SecurityConstraints, MD_ClassificationCode, MD_RestrictionCode.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="MD_Constraints_Type">
		<xs:annotation>
			<xs:documentation>Restrictions on the access and use of a dataset or metadata</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="useLimitation" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Constraints" type="gmd:MD_Constraints_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Constraints_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Constraints"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_LegalConstraints_Type">
		<xs:annotation>
			<xs:documentation>Restrictions and legal prerequisites for accessing and using the dataset.</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:MD_Constraints_Type">
				<xs:sequence>
					<xs:element name="accessConstraints" type="gmd:MD_RestrictionCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="useConstraints" type="gmd:MD_RestrictionCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="otherConstraints" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_LegalConstraints" type="gmd:MD_LegalConstraints_Type" substitutionGroup="gmd:MD_Constraints"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_LegalConstraints_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_LegalConstraints"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_SecurityConstraints_Type">
		<xs:annotation>
			<xs:documentation>Handling restrictions imposed on the dataset because of national security, privacy, or other concerns</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:MD_Constraints_Type">
				<xs:sequence>
					<xs:element name="classification" type="gmd:MD_ClassificationCode_PropertyType"/>
					<xs:element name="userNote" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="classificationSystem" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="handlingDescription" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_SecurityConstraints" type="gmd:MD_SecurityConstraints_Type" substitutionGroup="gmd:MD_Constraints"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_SecurityConstraints_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_SecurityConstraints"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_ClassificationCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ClassificationCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ClassificationCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_RestrictionCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_RestrictionCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_RestrictionCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/distribution.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This distribution.xsd schema implements the UML conceptual schema defined in A.2.10 of ISO 19115:2003. It contains the implementation of the following classes: MD_Medium, MD_DigitalTransferOptions, MD_StandardOrderProcess, MD_Distributor, MD_Distribution, MD_Format, MD_MediumFormatCode, MD_MediumNameCode.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="citation.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="MD_Medium_Type">
		<xs:annotation>
			<xs:documentation>Information about the media on which the data can be distributed</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="name" type="gmd:MD_MediumNameCode_PropertyType" minOccurs="0"/>
					<xs:element name="density" type="gco:Real_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="densityUnits" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="volumes" type="gco:Integer_PropertyType" minOccurs="0"/>
					<xs:element name="mediumFormat" type="gmd:MD_MediumFormatCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="mediumNote" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Medium" type="gmd:MD_Medium_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Medium_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Medium"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_DigitalTransferOptions_Type">
		<xs:annotation>
			<xs:documentation>Technical means and media by which a dataset is obtained from the distributor</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="unitsOfDistribution" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="transferSize" type="gco:Real_PropertyType" minOccurs="0"/>
					<xs:element name="onLine" type="gmd:CI_OnlineResource_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="offLine" type="gmd:MD_Medium_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_DigitalTransferOptions" type="gmd:MD_DigitalTransferOptions_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_DigitalTransferOptions_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_DigitalTransferOptions"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_StandardOrderProcess_Type">
		<xs:annotation>
			<xs:documentation>Common ways in which the dataset may be obtained or received, and related instructions and fee information</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="fees" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="plannedAvailableDateTime" type="gco:DateTime_PropertyType" minOccurs="0"/>
					<xs:element name="orderingInstructions" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="turnaround" type="gco:CharacterString_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_StandardOrderProcess" type="gmd:MD_StandardOrderProcess_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_StandardOrderProcess_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_StandardOrderProcess"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Distributor_Type">
		<xs:annotation>
			<xs:documentation>Information about the distributor</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="distributorContact" type="gmd:CI_ResponsibleParty_PropertyType"/>
					<xs:element name="distributionOrderProcess" type="gmd:MD_StandardOrderProcess_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="distributorFormat" type="gmd:MD_Format_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="distributorTransferOptions" type="gmd:MD_DigitalTransferOptions_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Distributor" type="gmd:MD_Distributor_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Distributor_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Distributor"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Distribution_Type">
		<xs:annotation>
			<xs:documentation>Information about the distributor of and options for obtaining the dataset</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="distributionFormat" type="gmd:MD_Format_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="distributor" type="gmd:MD_Distributor_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="transferOptions" type="gmd:MD_DigitalTransferOptions_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Distribution" type="gmd:MD_Distribution_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Distribution_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Distribution"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_Format_Type">
		<xs:annotation>
			<xs:documentation>Description of the form of the data to be distributed</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="name" type="gco:CharacterString_PropertyType"/>
					<xs:element name="version" type="gco:CharacterString_PropertyType"/>
					<xs:element name="amendmentNumber" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="specification" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="fileDecompressionTechnique" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="formatDistributor" type="gmd:MD_Distributor_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_Format" type="gmd:MD_Format_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_Format_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_Format"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_DistributionUnits" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_DistributionUnits_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_DistributionUnits"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_MediumFormatCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_MediumFormatCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_MediumFormatCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_MediumNameCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_MediumNameCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_MediumNameCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/maintenance.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This maintenance.xsd schema implements the UML conceptual schema defined in A.2.5 of ISO 19115:2003. It contains the implementation of the following classes: MD_MaintenanceInformation, MD_MaintenanceFrequencyCode, MD_ScopeCode, MD_ScopeDescription.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gts" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gts/gts.xsd"/>
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="citation.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="MD_MaintenanceInformation_Type">
		<xs:annotation>
			<xs:documentation>Information about the scope and frequency of updating</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="maintenanceAndUpdateFrequency" type="gmd:MD_MaintenanceFrequencyCode_PropertyType"/>
					<xs:element name="dateOfNextUpdate" type="gco:Date_PropertyType" minOccurs="0"/>
					<xs:element name="userDefinedMaintenanceFrequency" type="gts:TM_PeriodDuration_PropertyType" minOccurs="0"/>
					<xs:element name="updateScope" type="gmd:MD_ScopeCode_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="updateScopeDescription" type="gmd:MD_ScopeDescription_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="maintenanceNote" type="gco:CharacterString_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="contact" type="gmd:CI_ResponsibleParty_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_MaintenanceInformation" type="gmd:MD_MaintenanceInformation_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_MaintenanceInformation_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_MaintenanceInformation"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="MD_ScopeDescription_Type">
		<xs:annotation>
			<xs:documentation>Description of the class of information covered by the information</xs:documentation>
		</xs:annotation>
		<xs:choice>
			<xs:element name="attributes" type="gco:ObjectReference_PropertyType" maxOccurs="unbounded"/>
			<xs:element name="features" type="gco:ObjectReference_PropertyType" maxOccurs="unbounded"/>
			<xs:element name="featureInstances" type="gco:ObjectReference_PropertyType" maxOccurs="unbounded"/>
			<xs:element name="attributeInstances" type="gco:ObjectReference_PropertyType" maxOccurs="unbounded"/>
			<xs:element name="dataset" type="gco:CharacterString_PropertyType"/>
			<xs:element name="other" type="gco:CharacterString_PropertyType"/>
		</xs:choice>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="MD_ScopeDescription" type="gmd:MD_ScopeDescription_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ScopeDescription_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ScopeDescription"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_MaintenanceFrequencyCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_MaintenanceFrequencyCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_MaintenanceFrequencyCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="MD_ScopeCode" type="gco:CodeListValue_Type" substitutionGroup="gco:CharacterString"/>
	<!-- ........................................................................ -->
	<xs:complexType name="MD_ScopeCode_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:MD_ScopeCode"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gmd/extent.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:gss="http://www.isotc211.org/2005/gss" xmlns:gmd="http://www.isotc211.org/2005/gmd" targetNamespace="http://www.isotc211.org/2005/gmd" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic MetaData (GMD) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GMD includes all the definitions of http://www.isotc211.org/2005/gmd namespace. The root document of this namespace is the file gmd.xsd. This extent.xsd schema implements the UML conceptual schema defined in A.3.1 of ISO 19115:2003 and the associated corrigendum. It contains the implementation of the following classes: EX_TemporalExtent, EX_VerticalExtent, EX_BoundingPolygon, EX_Extent, EX_GeographicExtent, EX_GeographicBoundingBox, EX_SpatialTemporalExtent, EX_GeographicDescription.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gss" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gss/gss.xsd"/>
	<xs:import namespace="http://www.isotc211.org/2005/gts" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gts/gts.xsd"/>
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:import namespace="http://www.isotc211.org/2005/gsr" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gsr/gsr.xsd"/>
	<xs:include schemaLocation="gmd.xsd"/>
	<xs:include schemaLocation="referenceSystem.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<xs:complexType name="EX_TemporalExtent_Type">
		<xs:annotation>
			<xs:documentation>Time period covered by the content of the dataset</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="extent" type="gts:TM_Primitive_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="EX_TemporalExtent" type="gmd:EX_TemporalExtent_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="EX_TemporalExtent_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:EX_TemporalExtent"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="EX_VerticalExtent_Type">
		<xs:annotation>
			<xs:documentation>Vertical domain of dataset</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="minimumValue" type="gco:Real_PropertyType"/>
					<xs:element name="maximumValue" type="gco:Real_PropertyType"/>
					<xs:element name="verticalCRS" type="gsr:SC_CRS_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="EX_VerticalExtent" type="gmd:EX_VerticalExtent_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="EX_VerticalExtent_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:EX_VerticalExtent"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="EX_BoundingPolygon_Type">
		<xs:annotation>
			<xs:documentation>Boundary enclosing the dataset expressed as the closed set of (x,y) coordinates of the polygon (last point replicates first point)</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:AbstractEX_GeographicExtent_Type">
				<xs:sequence>
					<xs:element name="polygon" type="gss:GM_Object_PropertyType" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="EX_BoundingPolygon" type="gmd:EX_BoundingPolygon_Type" substitutionGroup="gmd:AbstractEX_GeographicExtent"/>
	<!-- ........................................................................ -->
	<xs:complexType name="EX_BoundingPolygon_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:EX_BoundingPolygon"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="EX_Extent_Type">
		<xs:annotation>
			<xs:documentation>Information about spatial, vertical, and temporal extent</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="description" type="gco:CharacterString_PropertyType" minOccurs="0"/>
					<xs:element name="geographicElement" type="gmd:EX_GeographicExtent_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="temporalElement" type="gmd:EX_TemporalExtent_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
					<xs:element name="verticalElement" type="gmd:EX_VerticalExtent_PropertyType" minOccurs="0" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="EX_Extent" type="gmd:EX_Extent_Type"/>
	<!-- ........................................................................ -->
	<xs:complexType name="EX_Extent_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:EX_Extent"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="AbstractEX_GeographicExtent_Type" abstract="true">
		<xs:annotation>
			<xs:documentation>Geographic area of the dataset</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gco:AbstractObject_Type">
				<xs:sequence>
					<xs:element name="extentTypeCode" type="gco:Boolean_PropertyType" minOccurs="0"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="AbstractEX_GeographicExtent" type="gmd:AbstractEX_GeographicExtent_Type" abstract="true"/>
	<!-- ........................................................................ -->
	<xs:complexType name="EX_GeographicExtent_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:AbstractEX_GeographicExtent"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="EX_GeographicBoundingBox_Type">
		<xs:annotation>
			<xs:documentation>Geographic area of the entire dataset referenced to WGS 84</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:AbstractEX_GeographicExtent_Type">
				<xs:sequence>
					<xs:element name="westBoundLongitude" type="gco:Decimal_PropertyType"/>
					<xs:element name="eastBoundLongitude" type="gco:Decimal_PropertyType"/>
					<xs:element name="southBoundLatitude" type="gco:Decimal_PropertyType"/>
					<xs:element name="northBoundLatitude" type="gco:Decimal_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="EX_GeographicBoundingBox" type="gmd:EX_GeographicBoundingBox_Type" substitutionGroup="gmd:AbstractEX_GeographicExtent"/>
	<!-- ........................................................................ -->
	<xs:complexType name="EX_GeographicBoundingBox_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:EX_GeographicBoundingBox"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="EX_SpatialTemporalExtent_Type">
		<xs:annotation>
			<xs:documentation>Extent with respect to date and time</xs:documentation>
		</xs:annotation>
		<xs:complexContent>
			<xs:extension base="gmd:EX_TemporalExtent_Type">
				<xs:sequence>
					<xs:element name="spatialExtent" type="gmd:EX_GeographicExtent_PropertyType" maxOccurs="unbounded"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="EX_SpatialTemporalExtent" type="gmd:EX_SpatialTemporalExtent_Type" substitutionGroup="gmd:EX_TemporalExtent"/>
	<!-- ........................................................................ -->
	<xs:complexType name="EX_SpatialTemporalExtent_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:EX_SpatialTemporalExtent"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<xs:complexType name="EX_GeographicDescription_Type">
		<xs:complexContent>
			<xs:extension base="gmd:AbstractEX_GeographicExtent_Type">
				<xs:sequence>
					<xs:element name="geographicIdentifier" type="gmd:MD_Identifier_PropertyType"/>
				</xs:sequence>
			</xs:extension>
		</xs:complexContent>
	</xs:complexType>
	<!-- ........................................................................ -->
	<xs:element name="EX_GeographicDescription" type="gmd:EX_GeographicDescription_Type" substitutionGroup="gmd:AbstractEX_GeographicExtent"/>
	<!-- ........................................................................ -->
	<xs:complexType name="EX_GeographicDescription_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gmd:EX_GeographicDescription"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gts/gts.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gts="http://www.isotc211.org/2005/gts" targetNamespace="http://www.isotc211.org/2005/gts" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic Temporal Schema (GTS) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GTS includes all the definitions of http://www.isotc211.org/2005/gts namespace. The root document of this namespace is the file gts.xsd.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:include schemaLocation="temporalObjects.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gsr/gsr.xsd',`
<xs:schema targetNamespace="http://www.isotc211.org/2005/gsr" elementFormDefault="qualified" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gsr="http://www.isotc211.org/2005/gsr" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic Spatial Referencing (GSR) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GSR includes all the definitions of http://www.isotc211.org/2005/gsr namespace. The root document of this namespace is the file gsr.xsd.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:include schemaLocation="spatialReferencing.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gts/temporalObjects.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gts="http://www.isotc211.org/2005/gts" targetNamespace="http://www.isotc211.org/2005/gts" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic Temporal Schema (GTS) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GTS includes all the definitions of http://www.isotc211.org/2005/gts namespace. The root document of this namespace is the file gts.xsd. The temporalObjects.xsd schema contains the XML implementation of TM_Object, TM_Primitive and TM_PeriodDuration from ISO 19108. The encoding of these classes is mapped to ISO 19136 temporal types and W3C built-in types.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.opengis.net/gml/3.2" schemaLocation="http://schemas.opengis.net/gml/3.2.1/gml.xsd"/>
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:include schemaLocation="gts.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<!-- ........................................................................ -->
	<!--==XCGE: gml:AbstractTimePrimitive==-->
	<!-- ........................................................................ -->
	<xs:complexType name="TM_Primitive_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:AbstractTimePrimitive"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
	<!-- ........................................................................ -->
	<xs:element name="TM_PeriodDuration" type="xs:duration"/>
	<!-- ........................................................................ -->
	<xs:complexType name="TM_PeriodDuration_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gts:TM_PeriodDuration"/>
		</xs:sequence>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`],['http://schemas.opengis.net/iso/19139/20070417/gsr/spatialReferencing.xsd',`
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gsr="http://www.isotc211.org/2005/gsr" targetNamespace="http://www.isotc211.org/2005/gsr" elementFormDefault="qualified" version="2012-07-13">
	<!-- ================================= Annotation ================================ -->
	<xs:annotation>
		<xs:documentation>Geographic Spatial Referencing (GSR) extensible markup language is a component of the XML Schema Implementation of Geographic Information Metadata documented in ISO/TS 19139:2007. GSR includes all the definitions of http://www.isotc211.org/2005/gsr namespace. The root document of this namespace is the file gsr.xsd. This spatialReferencing.xsd schema contains the implementation of SC_CRS. The encoding of this class is mapped to an ISO 19136 XML type.</xs:documentation>
	</xs:annotation>
	<!-- ================================== Imports ================================== -->
	<xs:import namespace="http://www.isotc211.org/2005/gco" schemaLocation="http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd"/>
	<xs:import namespace="http://www.opengis.net/gml/3.2" schemaLocation="http://schemas.opengis.net/gml/3.2.1/gml.xsd"/>
	<xs:include schemaLocation="gsr.xsd"/>
	<!-- ########################################################################### -->
	<!-- ########################################################################### -->
	<!-- ================================== Classes ================================= -->
	<!-- ........................................................................ -->
	<!--==XCGE: gml:AbstractCRS==-->
	<!-- ........................................................................ -->
	<xs:complexType name="SC_CRS_PropertyType">
		<xs:sequence minOccurs="0">
			<xs:element ref="gml:AbstractCRS"/>
		</xs:sequence>
		<xs:attributeGroup ref="gco:ObjectReference"/>
		<xs:attribute ref="gco:nilReason"/>
	</xs:complexType>
	<!-- =========================================================================== -->
</xs:schema>
`]]);