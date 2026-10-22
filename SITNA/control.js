import TC from '../TC.js';
import Control from './control/Control.js';
import WebComponentControl from '../TC/control/WebComponentControl.js';
import Attribution from '../TC/control/Attribution.js';
import BasemapSelector from '../TC/control/BasemapSelector.js';
import CacheBuilder from '../TC/control/CacheBuilder.js';
import Click from '../TC/control/Click.js';
import Container from '../TC/control/Container.js';
import ControlContainer from '../TC/control/ControlContainer.js';
import Coordinates from '../TC/control/Coordinates.js';
import DataLoader from '../TC/control/DataLoader.js';
import Download from '../TC/control/Download.js';
import Draw from '../TC/control/Draw.js';
import DrawMeasureModify from '../TC/control/DrawMeasureModify.js';
import Edit from '../TC/control/Edit.js';
import Elevation from '../TC/control/Elevation.js';
import ExternalWMS from '../TC/control/ExternalWMS.js';
import FeatureDownloadDialog from '../TC/control/FeatureDownloadDialog.js';
import FeatureInfo from '../TC/control/FeatureInfo.js';
import FeatureInfoCommons from '../TC/control/FeatureInfoCommons.js';
import FeatureTools from '../TC/control/FeatureTools.js';
import FileEdit from '../TC/control/FileEdit.js';
import FileImport from '../TC/control/FileImport.js';
import FullScreen from '../TC/control/FullScreen.js';
import Geolocation from '../TC/control/Geolocation.js';
import GeometryFeatureInfo from '../TC/control/GeometryFeatureInfo.js';
import LanguageSelector from '../TC/control/LanguageSelector.js';
import LayerCatalog from '../TC/control/LayerCatalog.js';
import Legend from '../TC/control/Legend.js';
import LineFeatureInfo from '../TC/control/LineFeatureInfo.js';
import LoadingIndicator from '../TC/control/LoadingIndicator.js';
import MapContents from '../TC/control/MapContents.js';
import MapInfo from '../TC/control/MapInfo.js';
import Measure from '../TC/control/Measure.js';
import Measurement from '../TC/control/Measurement.js';
import Modify from '../TC/control/Modify.js';
import MultiFeatureInfo from '../TC/control/MultiFeatureInfo.js';
import NavBar from '../TC/control/NavBar.js';
import NavBarHome from '../TC/control/NavBarHome.js';
import OfflineMapMaker from '../TC/control/OfflineMapMaker.js';
import OverviewMap from '../TC/control/OverviewMap.js';
import PolygonFeatureInfo from '../TC/control/PolygonFeatureInfo.js';
import Popup from '../TC/control/Popup.js';
import Print from '../TC/control/Print.js';
import PrintMap from '../TC/control/PrintMap.js';
import ProjectionSelector from '../TC/control/ProjectionSelector.js';
import ResultsPanel from '../TC/control/ResultsPanel.js';
import Scale from '../TC/control/Scale.js';
import ScaleBar from '../TC/control/ScaleBar.js';
import ScaleSelector from '../TC/control/ScaleSelector.js';
import Search from '../TC/control/Search.js';
import SelectContainer from '../TC/control/SelectContainer.js';
import Share from '../TC/control/Share.js';
import StreetView from '../TC/control/StreetView.js';
import SWCacheClient from '../TC/control/SWCacheClient.js';
import TabContainer from '../TC/control/TabContainer.js';
import ThreeD from '../TC/control/ThreeD.js';
import TOC from '../TC/control/TOC.js';
import WFSEdit from '../TC/control/WFSEdit.js';
import WFSQuery from '../TC/control/WFSQuery.js';
import WorkLayerManager from '../TC/control/WorkLayerManager.js';
import Route from '../TC/control/Route.js';
import ElevationProfile from '../TC/control/ElevationProfile.js';
import LayerComparer from '../TC/control/LayerComparer.js';
import CompactBasemapSelector from '../TC/control/CompactBasemapSelector.js';
import TimeSlider from '../TC/control/TimeSlider.js';
import CenterOnLocation from '../TC/control/CenterOnLocation.js';

/**
 * @namespace SITNA.control
 * @summary Espacio de nombres de los controles de la interfaz de usuario.
 */

const control = {
    Control,
    WebComponentControl,
    Attribution,
    BasemapSelector,
    CacheBuilder,
    CenterOnLocation,
    Click,
    CompactBasemapSelector,
    Container,
    ControlContainer,
    Coordinates,
    DataLoader,
    Download,
    Draw,
    DrawMeasureModify,
    Edit,
    Elevation,
    ElevationProfile,
    ExternalWMS,
    FeatureDownloadDialog,
    FeatureInfo,
    FeatureInfoCommons,
    FeatureTools,
    FileEdit,
    FileImport,
    FullScreen,
    Geolocation,
    GeometryFeatureInfo,
    LanguageSelector,
    LayerCatalog,
    LayerComparer,
    Legend,
    LineFeatureInfo,
    LoadingIndicator,
    MapContents,
    MapInfo,
    Measure,
    Measurement,
    Modify,
    MultiFeatureInfo,
    NavBar,
    NavBarHome,
    OfflineMapMaker,
    OverviewMap,
    PolygonFeatureInfo,
    Popup,
    Print,
    PrintMap,
    ProjectionSelector,
    ResultsPanel,
    Route,
    Scale,
    ScaleBar,
    ScaleSelector,
    Search,
    SelectContainer,
    Share,
    StreetView,
    SWCacheClient,
    TabContainer,
    ThreeD,
    TimeSlider,
    TOC,
    WFSEdit,
    WFSQuery,
    WorkLayerManager,
};

TC.control = control;
export default control;