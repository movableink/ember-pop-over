# ember {{popup-menu}}

This popup-menu provides a pluggable interface for dealing with popups around your site. It has an inteface for registering constraint behaviors and animations.

For use of the popup-menu as a tooltip, the following handlebars will do the trick:

```handlebars
<span id="help-me" class="icon-help"></span>
{{#popup-menu for="help-me" on="hover"}}
  Hey there!
{{/popup-menu}}
```

## Recipes

Tooltips:
```javascript
import PopupMenu from "ember-popup-menu/components/popup";

var ToolTip = PopupMenu.extend({
  classNames: ['tool-tip'],
  layoutName: 'components/popup-menu',
  on: ['hover', 'focus'],
  flow: 'popup'
});

export default ToolTip;
```

```handlebars
<span id="help-me" class="icon-help"></span>
{{#tool-tip for="help-me"}}
  Hey there!
{{/tool-tip}}
```

Dropdown menu:
```javascript
import PopupMenu from "ember-popup-menu/components/popup";

var DropDown = PopupMenu.extend({
  classNames: ['drop-down'],
  layoutName: 'components/popup-menu',
  on: ['hover', 'focus', 'hold'],
  flow: 'dropdown'
});

export default DropDown;
```

```handlebars
<div id="current-user">Me</div>
{{#drop-down for="help-me"}}
  <ul>
    <li>Settings</li>
    <li>Billing</li>
  </ul>
{{/drop-down}}
```

## Installation

* `npm install --save-dev ember-popup-menu`
* `ember g ember-popup-menu`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
