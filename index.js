/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/app/App';
import {name as appName} from './app.json';
import './src/i18n'
import "./global.css";
AppRegistry.registerComponent(appName, () => App);