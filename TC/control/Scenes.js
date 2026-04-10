
import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import wrap from '../ol/ol.js';
import Control from '../Control.js';

import Observer from '../Observer.js';
import Controller from '../Controller.js';

import {PointCloudStyles} from '../cesium/TileSetManager.js';



//import wwBlob from '../../workers/laz-loader-worker.js';

TC.control = TC.control || {};
TC.wrap = wrap;

const timeSeparatorChar = 'T';

const getIsoStringFromDate = dateValue => dateValue.toLocaleString("sv-SE").replace(' ', timeSeparatorChar);

const pointCloudExtension = "3DTILES_draco_point_compression";

class ScenesEntity {
    constructor() {
        this.scenesTitle="";
        this.showHide = "";
        this.zoomToSceneToolTip = "";
        this.showHideShadowTooltip = "";
        this.transparencyTitle = "";
        this.pointSizeTitle = "";
        this.showShadows = false;
        this.shadowDateTimeValue = getIsoStringFromDate(new Date());
        this.shadowDateTimeTitle = "";

    }    
}

class Scenes extends Control {
    #scenesList = [];
    #sortable;
    #pointAdjustTime;
    constructor(div,data) {
        super(...arguments);
        const self = this;
        self.mvcEntity = new ScenesEntity();
        self.mvcEntity["visibilityChange"] = (e) => {            
            self.setSceneVisibility(Number(e.target.parentElement.dataset.index));
        };
        self.mvcEntity["zoomToScene"] = (e) => {
            self.zoomToScene(Number(e.target.parentElement.dataset.index));
        };
        self.mvcEntity["showHideShadow"] = (e) => {
            self.map.view3D.tileSetManager.showHideShadow(e.target.checked);
            this.mvcEntity.showShadows = e.target.checked
            self.map.trigger(Consts.event.THREED_TILES_CHANGE, { change: "shadow" });
        };
        self.mvcEntity["sliderChange"] = (e) => {
            self.setOpacity(Number(e.target.closest("li").dataset.index), e.target.value);
        };
        self.mvcEntity["pointSizeChange"] = (e) => {
            const pointSize = e.target.valueAsNumber;
            if (self.#pointAdjustTime)
                clearTimeout(self.#pointAdjustTime);
            self.#pointAdjustTime = setTimeout(() => { 
                //self.setHeight(Number(e.target.parentElement.dataset.index), height);
                self.setPointSize(Number(e.target.parentElement.dataset.index), pointSize);
            },500)
            
        };
        self.mvcEntity["shadowDateTimeChange"] = (e) => {
            if (Date.parse(e.target.value)) {
                self.mvcEntity.shadowDateTimeValue = e.target.value;
                self.map.view3D.tileSetManager.setViewerTime(e.target.value);
                self.map.trigger(Consts.event.THREED_TILES_CHANGE, { change: "shadow" });
                console.log(self.map.view3D.tileSetManager.isSunVisible());
            }                
        }
        self.mvcEntity["attributeChange"] = (e) => {
            self.setStyle(Number(e.target.parentElement.dataset.index), Number(e.target.value));
        }
        self.mvcEntity["uploadLAS"] = (e) => {

        }
        data.list.forEach((scene) => self.#scenesList.push(scene));        
    }
    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-scenes.mjs');        

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        self.template = template;
    }
    async render(callback) {
        const self = this;        
        await self.renderData({ "scenes": self.#scenesList }, function () {
            
            self.controller = new Controller(self.mvcEntity, new Observer(self.div));
            if (Util.isFunction(callback)) {
                callback();
            }
            //const fileInput = self.div.querySelector("input[type='file']");
            //fileInput.addEventListener('change', async function (e) {                
            //    self.map.view3D.tileSetManager.fromLAS(e.target.files[0]);                
            //});
        }); 
        self.updateModel();
    }    
    async setSceneVisibility(index,height,visibility) {
        const self = this;
        const currentScene = this.#scenesList[index];
           
        visibility = visibility === undefined ? !(currentScene?.visible || false) : visibility;
        if (!visibility && !self.map.view3D.tileSetManager.exists(currentScene.url)) return;
        var li = self.map.getLoadingIndicator();
        let waitId
        if (li) {
            waitId = li.addWait(waitId);
        }
        const threeDTile = await self.map.view3D.tileSetManager.showHide3DTileset(currentScene.url, index, height || currentScene.height, visibility);
        const isPointCloud = threeDTile.hasExtension(pointCloudExtension);    
        currentScene.visible = visibility;        
        if (isPointCloud) { 
            self.div.querySelector("." + self.CLASS + "-list-item:nth-child(" + (index + 1) + ") ." + self.CLASS + "-list-pointSize").classList.toggle("tc-hidden");
            self.div.querySelector("." + self.CLASS + "-list-item:nth-child(" + (index + 1) + ") ." + self.CLASS + "-list-attribute").classList.toggle("tc-hidden")
        }  
        self.div.querySelector("." + self.CLASS + "-list-item:nth-child(" + (index + 1) + ") ." + self.CLASS + "-list-zoom").disabled = !currentScene.visible;
        self.div.querySelector("." + self.CLASS + "-list-item:nth-child(" + (index + 1) + ") input[type='range']").disabled = !currentScene.visible;
        li.removeWait(waitId);
        self.map.trigger(Consts.event.THREED_TILES_CHANGE, { tileset: currentScene, change: "visibility" });
        
    }
    async getScenesVisibility() {
        const self = this;
        //const currentScene = this.#scenesList[index];
        self.map.view3D.tileSetManager.get3DTilesetVisibility();
    }
    zoomToScene(index) { 
        const self = this;
        const currentScene = this.#scenesList[index];
        self.map.view3D.tileSetManager.zoomTo3DTileset(currentScene.url);
    }
    setOpacity(index, opacity) { 
        const self = this;
        const currentScene = this.#scenesList[index];
        self.map.view3D.tileSetManager.opacity3DTileset(currentScene.url, opacity);
        currentScene.opacity = opacity;
        self.map.trigger(Consts.event.THREED_TILES_CHANGE, { tileset: currentScene, change: "opacity" });
    }
    setHeight(index,height) {
        const self = this;
        const currentScene = this.#scenesList[index];
        self.map.view3D.tileSetManager.set3DTilesetHeight(currentScene.url, height);
        currentScene.height = height;
    }
    setPointSize(index, size) {
        const self = this;
        const currentScene = this.#scenesList[index];
        self.map.view3D.tileSetManager.set3DTilesetPointSize(currentScene.url, size);
        currentScene.pointSize = size;
    }
    setStyle(index, style) {
        const self = this;
        const currentScene = this.#scenesList[index];
        const key = Object.keys(PointCloudStyles)[style - 1]
        self.map.view3D.tileSetManager.setPointCloudStyle(currentScene.url, PointCloudStyles[key]);
    }
    async register(map) {
        const self = this;
                
        return await super.register.call(self, map);
    }
    exportState() {
        return {            
            "m": this.#scenesList.map((scene) => {
                return [
                    scene?.visible ? 1 : 0,
                    (scene?.opacity && scene?.opacity) ? scene?.opacity : "",
                    scene?.height].join("-");
            }),
            "s": this.mvcEntity.showShadows ? this.mvcEntity.shadowDateTimeValue:null
        };
    }
    async importState(state) {
        const self = this;
        const arrProm = state.m.map(async (scene, index) => {
            scene = scene.split("-").map((n) => n ? Number(n) : null);
            await self.setSceneVisibility(index, scene[2] || 0, !!scene[0]);
            
            //TODO: Hacerlo MVC
            const currentLi = self.div.querySelector("." + self.CLASS + "-list-item[data-index='" + index + "']");
            if (currentLi) {
                currentLi.querySelector("." + self.CLASS + "-list-show").checked = !!scene[0];
                //currentLi.querySelector("." + self.CLASS + "-list-pointSize").valueAsNumber = scene.p;
                currentLi.querySelector("input[type='range']").valueAsNumber = scene[1] === null ? 100 : scene[1];
            }
        });
        if (state.s) {
            self.mvcEntity.showShadows = true;
            self.map.view3D.tileSetManager.showHideShadow(true);
            this.mvcEntity.shadowDateTimeValue = state.s;
            self.map.view3D.tileSetManager.setViewerTime(state.s);
        }
        await Promise.all(arrProm);
    }    

    updateModel() {
        const self = this;
        self.mvcEntity.scenesTitle = self.getLocaleString("scene.title");
        self.mvcEntity.showHide = self.getLocaleString("scene.show.hide");
        self.mvcEntity.zoomToSceneToolTip = self.getLocaleString("scene.zoomTo");
        self.mvcEntity.showHideShadowTooltip = self.getLocaleString("scene.show.hide.shadow");
        self.mvcEntity.transparencyTitle = self.getLocaleString("scene.opacity");
        self.mvcEntity.pointSizeTitle = self.getLocaleString("scene.point.size");                
        self.mvcEntity.shadowDateTimeTitle = self.getLocaleString("scene.shadow.moment");
    }
    async updateLanguage() {
        const self = this;
        //cambiar el title de las escenas
        this.#scenesList.forEach((scene, index) => {
            const textNode = self.div.querySelector(".tc-ctl-scenes-list-item[data-index='" + index + "'] span").firstChild;
            textNode.textContent = scene.title[TC.i18n.currentLocaleKey] || scene.title[TC.i18n.currentLocaleKey.substring(0, 2)] || scene.title["es"] || textNode.textContent;
        });

        self.updateModel();
    }
}

Scenes.prototype.CLASS = 'tc-ctl-scenes';
TC.control.Scenes = Scenes;
export default Scenes;