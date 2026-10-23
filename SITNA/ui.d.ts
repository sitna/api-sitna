import Component from './ui/Component';
import Button from './ui/Button';
import Toggle from './ui/Toggle';
import Tab from './ui/Tab';

export default interface UI {
    Component: typeof Component;
    Button: typeof Button;
    Toggle: typeof Toggle;
    Tab: typeof Tab;
}