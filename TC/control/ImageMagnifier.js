import TC from '../../TC';
import Consts from '../Consts';
//import { Defaults } from '../Cfg';
//import Util from '../Util';
import WebComponentControl from './WebComponentControl';

TC.control = TC.control || {};

const topClassName = 'tc-ctl-img-magnifier-top';
const bottomClassName = 'tc-ctl-img-magnifier-bottom';
const leftClassName = 'tc-ctl-img-magnifier-left';
const rightClassName = 'tc-ctl-img-magnifier-right';
const className = 'tc-ctl-img-magnifier';
const classNameAvailable = 'tc-ctl-img-magnified';
const noAnchorClassName = 'tc-ctl-img-magnifier-no-anchor';
const bgClassName = 'tc-ctl-img-magnifier-bg';
const elementName = 'sitna-image-magnifier';



class ImageMagnifier extends WebComponentControl {
    CLASS = className;
    #classSelector = '.' + className;    
    #parent;
    #zoom;
    #texts;
    #bgContent;    

    constructor(zoom,texts) {
        super(...arguments);
        const self = this;
        self.#zoom = zoom;
        self.classList.add(Consts.classes.HIDDEN);
        self.addEventListener("click", function (_event) {
            self.hideMagnifier();
        });
        self.#texts = texts;
        self.title = texts.textToClose;
        self.#bgContent =  document.createElement("div");
        self.#bgContent.classList.add(bgClassName)
        self.appendChild(self.#bgContent);
        self.#bgContent.addEventListener("pointerup", function (event) {
            event.preventDefault();
            self.hideMagnifier();
        });
        self.#bgContent.addEventListener("mouseleave", function (_event) {
            self.hideMagnifier();
        });
    }

    #mouseEnterEvent(event,img, zoom) {
        const self = this;
        const _zoom = self.#zoom || zoom;

        self.#bgContent.style.backgroundImage = "url('" + img.src + "')";        
        self.style.width = ((img.width * _zoom) + 10) + "px";
        self.style.height = ((img.height * _zoom) + 10) + "px";

        self.classList.remove(topClassName);
        self.classList.remove(bottomClassName);
        self.classList.remove(leftClassName);
        self.classList.remove(rightClassName);
        self.classList.remove(noAnchorClassName);

        const clientRect = img.getBoundingClientRect();
        var selfRect = self.getBoundingClientRect();
        var x, y;
        //calcular la posición de la lupa
        const shiftX = 20;
        const shiftY = TC.browserFeatures.touch()?15:8;        
        //calculamos la cuadricula de la pantalla
        
        //lado inferior de la pantalla
        y = clientRect.top - selfRect.height - shiftY;
        self.classList.add(topClassName);
        if (self.parentElement.clientWidth / 2 > event.clientX) {
            //lado izquierdo de la pantalla
            x = clientRect.left + clientRect.width / 2 - shiftX;                
            self.classList.add(rightClassName);
        }
        else {
            //lado derecho de la pantalla
            x = clientRect.left - selfRect.width + clientRect.width / 2 + shiftX;
            self.classList.add(leftClassName);
        }
        self.style.top = y + "px";
        self.style.left = x + "px";
        const newSelfRect = self.getBoundingClientRect();
        if (newSelfRect.right > self.parentElement.clientWidth) {
            self.style.left = newSelfRect.left - (newSelfRect.right - self.parentElement.clientWidth) + "px";
            self.classList.add(noAnchorClassName);
        }           
        if (newSelfRect.top < 0) {
            self.style.top = "0px";
            self.classList.add(noAnchorClassName);
        }
            
        if (newSelfRect.left < 0) {
            self.style.left = "0px";
            self.classList.add(noAnchorClassName);
        }
            
        if (newSelfRect.bottom < 0) {
            self.style.top = newSelfRect.height + "px";
            self.classList.add(noAnchorClassName);
        }
            

        self.classList.remove(Consts.classes.HIDDEN);
    }

    hideMagnifier() {
        const self = this;
        self.classList.add(Consts.classes.HIDDEN);
    }

    addNode(nodes,zoom) {
        const self = this;
        let _nodes = [];        
        switch (true) {
            case typeof (nodes) === "string":
                _nodes = _nodes.concat(Array.from(document.querySelectorAll(nodes)));
                break;
            case nodes instanceof Node:
                _nodes.push(nodes);
                break;
            case nodes instanceof NodeList:
                _nodes = _nodes.concat(Array.from(nodes));
                break;
        }        
        _nodes.forEach((node) => {
            node.classList.add(classNameAvailable)
            node.oncontextmenu = (e) => e.preventDefault();
            node.title = self.#texts.textToOpen;
            node.addEventListener("pointerdown", function (event) {
                event.preventDefault();
                if (!this.classList.contains(Consts.classes.NOT_AVAILABLE))
                    self.#mouseEnterEvent(event, this, zoom);                
            });
            node.addEventListener("pointerup", function (event) {
                event.preventDefault();
                if (!this.classList.contains(Consts.classes.NOT_AVAILABLE))
                    self.hideMagnifier();
            });            
            node.addEventListener("mouseleave", function (event) {
                if (event.relatedTarget !== self.#bgContent)
                    self.hideMagnifier();
            });
            if (TC.browserFeatures.touch())
                node.addEventListener("touchmove", function (_event) {
                    self.hideMagnifier();
                })
            
        });
        self.#bgContent.addEventListener("pointerup", function (event) {
            event.preventDefault();
            self.hideMagnifier();
        });   

    }
}

customElements.get(elementName) || customElements.define(elementName, ImageMagnifier);
TC.control.ImageMagnifier = ImageMagnifier;
export default ImageMagnifier;