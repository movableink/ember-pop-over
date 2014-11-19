# ember {{popup-menu}}

This popup-menu provides a pluggable interface for dealing with popups around your site. It has an inteface for registering constraint behaviors and animations.

For use of the popup-menu as a tooltip, the following handlebars will do the trick:

```handlebars
<span id="help-me" class="icon-help"></span>
{{#popup-menu for="help-me" on="hover"}}
  Hey there!
{{/popup-menu}}
```

## Installation

* `npm install --save-dev ember-popup-menu`
* `ember g ember-popup-menu`

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
{{#drop-down for="current-user"}}
  <ul>
    <li>Settings</li>
    <li>Billing</li>
  </ul>
{{/drop-down}}
```

## Writing your own components using {{popup-menu}}

The {{popup-menu}} component is designed to be used with other components. It provides a programatic API for adding customized targets, and a set of utilities that allow for an easier and more consistent development experience when authoring these addons.

Let's go through the steps of authoring a component that uses a {{popup-menu}} by making a {{date-picker}} widget. Some of the implementation details will be ignored to make this tutorial clearer to follow.

First, let's bootstrap the addon:

```bash
$ ember addon my-date-picker
```

After this we'll add `ember-popup-menu` and `ember-moment` as a dependencies (*not* a development dependency):

```bash
$ cd my-date-picker
$ npm install --save ember-popup-menu
$ ember g ember-popup-menu
$ npm install --save ember-moment
$ ember g ember-moment
```

Now, we're ready to start authoring the addon. Let's first start by creating the component javascript file.

```bash
$ mkdir addon/components
$ touch addon/components/date-picker.js
```

Using the editor of your choice, add the following bootstrap code to get started:

```javascript
import Ember from "ember";

var DatePicker = Ember.Component.extend({
  classNames: ['date-picker']
});

export default DatePicker;
```

Let's define our public API first. This is what you will use to interface with the component in handlebars:

```javascript
import Ember from "ember";

var DatePicker = Ember.Component.extend({
  value: null,
  icon: null
});

export default DatePicker;
```

`value` is the date that is picked and `icon` is an icon used to display a calendar icon.

We're going to make the date picker a combination of a text field and a configurable icon, so let's start hooking them up so the popup-menu knows what will trigger events:

```javascript
import Ember from "ember";
import nearestChild from "ember-popup-menu/computed/nearest-child";

var get = Ember.get;

var DatePicker = Ember.Component.extend({
  classNames: ['date-picker'],

  value: null,
  icon: null,
  
  popup: nearestChild('popup-menu'),
  
  attachTargets: function () {
    var popup = get(this, 'popup');
    var icon = get(this, 'icon');

    popup.addTarget(icon, {
      on: "click"
    });
  }.on('didInsertElement')
});

export default DatePicker;
```

Let's walk through the code.

First, we imported `nearestChild`. This is a computed property that returns the nearest child of a given type. We then use this property to get the popup-menu.

Then we add the icon as a target for the popup menu that will toggle the menu when clicked.

For the next step, let's start showing the popup live and doing some iterative development. To do this, we'll need to start fiddling with the app directory.

Create the `components` and `templates/components` directories under `app` at the root of your addon's project.

The first thing to do is expose the component as a public interface by making a file called `date-picker.js` under `components`:

```javascript
import DatePicker from "my-date-picker/components/date-picker";
export default DatePicker;
```

This simply exposes the date picker as a component consumable by the host application.

Next, let's add a handlebars template for the date picker, under `templates/components/date-picker.hbs`:

```handlebars
{{input type=text value=displayValue}}<span class="icon-calendar" {{bind-attr id=icon}}>Open</span>
{{#popup-menu flow="dropdown" will-change="month" month=month}}
  <header>
    <a class="previous-month" {{action "previousMonth"}}>&lt;</a>
    <div class="month">{{moment firstOfMonth "MMMM"}}</div>
    <a class="next-month" {{action "nextMonth"}}>&gt;</a>
  </header>
  {{calendar-month month=firstOfMonth}}
{{/popup-menu}}
```

With the template we created, we've solidified a few requirements for the component. Let's go back to `date-picker.js` in the addon directory and suss these out.

First, let's automatically generate an ID for the icon. This way, the popup-menu has a unique identifier for triggering on. While we're at it, let's implement the details around `month`.

```javascript
import Ember from "ember";
import nearestChild from "ember-popup-menu/computed/nearest-child";

var generateGuid = Ember.generateGuid;

var get = Ember.get;

var DatePicker = Ember.Component.extend({
  classNames: ['date-picker'],
  
  value: null,
  icon: function () {
    return generateGuid();
  }.property(),
  
  popup: nearestChild('popup-menu'),
  
  attachTargets: function () {
    var popup = get(this, 'popup');
    var icon = get(this, 'icon');

    popup.addTarget(icon, {
      on: "click"  
    });
  }.on('didInsertElement'),
  
  actions: {
    previousMonth: function () {
      var previousMonth = get(this, 'firstOfMonth').clone().subtract(1, 'month');
      set(this, 'month', previousMonth.month());
      set(this, 'year', previousMonth.year());
    },
    
    nextMonth: function () {
      var nextMonth = get(this, 'firstOfMonth').clone().add(1, 'month');
      set(this, 'month', nextMonth.month());
      set(this, 'year', nextMonth.year());
    }
  },
  
  month: null,
  year: null,
  
  firstOfMonth: function () {
    return moment({ year: get(this, 'year'), month: get(this, 'month') });
  }.property('year', 'month')

});

export default DatePicker;
```

As a default, let's make month be the current month *or* the month of the selected value:

```javascript
import Ember from "ember";
import moment from 'moment';
import nearestChild from "ember-popup-menu/computed/nearest-child";

var generateGuid = Ember.generateGuid;

var get = Ember.get;

var reads = Ember.computed.reads;

var DatePicker = Ember.Component.extend({
  classNames: ['date-picker'],
  
  value: null,
  icon: function () {
    return generateGuid();
  }.property(),
  
  popup: nearestChild('popup-menu'),
  
  attachTargets: function () {
    var popup = get(this, 'popup');
    var icon = get(this, 'icon');

    popup.addTarget(icon, {
      on: "click"
    });
  }.on('didInsertElement'),
  
  actions: {
    previousMonth: function () {
      var previousMonth = get(this, 'firstOfMonth').clone().subtract(1, 'month');
      set(this, 'month', previousMonth.month());
      set(this, 'year', previousMonth.year());
    },
    
    nextMonth: function () {
      var nextMonth = get(this, 'firstOfMonth').clone().add(1, 'month');
      set(this, 'month', nextMonth.month());
      set(this, 'year', nextMonth.year());
    }
  },
  
  month: reads('currentMonth'),
  year: reads('currentYear'),
  
  firstOfMonth: function () {
    return moment({ year: get(this, 'year'), month: get(this, 'month') });
  }.property('year', 'month'),
  
  currentMonth: function () {
    return get(this, 'value') ?
           get(this, 'value').getMonth() :
           new Date().getMonth();
  }.property(),
  
  currentYear: function () {
    return get(this, 'value') ?
           get(this, 'value').getFullYear() :
           new Date().getFullYear();
  }.property(),
  
  displayValue: function () {
    var value = get(this, 'value');
    return value ? moment(value).format("MM/DD/YYYY") : null;
  }.property('value')
});

export default DatePicker;
```

With this much, we should be able to rotate through a list of months in the calendar year. Let's test this by commenting out the `{{calendar-month}}` component:

```handlebars
{{input type=text value=displayValue}}<span class="icon-calendar" {{bind-attr id=icon}}>Open</span>
{{#popup-menu flow="dropdown" will-change="month" month=month}}
  <header>
    <a class="previous-month" {{action "previousMonth"}}>&lt;</a>
    <div class="month">{{moment firstOfMonth "MMMM"}}</div>
    <a class="next-month" {{action "nextMonth"}}>&gt;</a>
  </header>
  {{!calendar-month month=firstOfMonth}}
{{/popup-menu}}
```

Now on to the next step! Let's implement the calendar-month component. In `calendar-month.js` in your addon, let's add code to come up with the days of the week and weeks in the given month.

```javascript
import Ember from "ember";
import moment from "moment";

var get = Ember.get;

var CalendarMonth = Ember.Component.extend({
  classNames: ['calendar-month'],
  tagName: "table",
  
  dayNames: function () {
    var firstWeek = get(this, 'weeks.firstObject');
    return firstWeek.map(function (day) {
      return moment(day).format("ddd");
    });
  }.property('weeks'),
  
  weeks: function () {
    var month = get(this, 'month');
    var day = month.clone().startOf('week');
    var weeks = [];
    var week = [];
    for (var iDay = 0; iDay < 7; iDay++) {
      week.push(day.clone().toDate());
      day.add(1, 'day');
    }
    weeks.push(week);

    while (day.month() === month.month()) {
      week = [];
      for (iDay = 0; iDay < 7; iDay++) {
        week.push(day.clone().toDate());
        day.add(1, 'day');
      }
      weeks.push(week);
    }
    return weeks;
  }.property('month')
});

export default CalendarMonth;
```

And now let's add the template for that. First, expose the component in the app:

```javascript
import CalendarMonth from "my-date-picker/components/calendar-month";
export default CalendarMonth;
```

And then add the template for it:

```handlebars
<thead>
  <tr>
    {{#each dayOfWeek in dayNames}}
      <th>{{dayOfWeek}}</th>
    {{/each}}
  </tr>
</thead>
<tbody>
  {{#each week in weeks}}
    <tr>
      {{#each day in week}}
        {{calendar-day value=day month=month}}
      {{/each}}
    </tr>
  {{/each}}
</tbody>
```

Hmm. Looks like we have yet another component to write! Let's finish off with that one, and then pop the stack all the way back to finish off the component.

```javascript
import Ember from "ember";
import moment from "moment";
import nearestParent from "ember-popup-menu/computed/nearest-parent";

var get = Ember.get;

var reads = Ember.computed.reads;

var CalendarDay = Ember.Component.extend({
  classNames: ['calendar-day'],

  tagName: "td",
  classNameBindings: ['isSelected:selected', 'isToday', 'isDisabled:disabled'],
  
  datePicker: nearestParent('date-picker'),
  selection: reads('datePicker.value'),
  
  isToday: function () {
    return moment(get(this, 'value')).isSame(new Date(), 'day');
  }.property('value'),
  
  isSelected: function () {
    return moment(get(this, 'value')).isSame(get(this, 'selection'), 'day');
  }.property('value', 'selection'),
  
  isDisabled: function () {
    return !moment(get(this, 'value')).isSame(get(this, 'month'), 'month');
  }.property('value', 'month'),
  
  click: function () {
    if (get(this, 'isDisabled')) { return; }
    get(this, 'datePicker').send('selectDate', get(this, 'value'));
  }
});

export default CalendarDay;
```

```handlebars
<span>{{moment value "D"}}</span>
```

Now let's pop our stack and finish by writing a handler for `selectDate` in `date-picker.js`:

```javascript
import Ember from "ember";
import moment from 'moment';
import nearestChild from "ember-popup-menu/computed/nearest-child";

var generateGuid = Ember.generateGuid;

var get = Ember.get;
var set = Ember.set;

var reads = Ember.computed.reads;

var DatePicker = Ember.Component.extend({
  classNames: ['date-picker'],
  value: null,
  icon: function () {
    return generateGuid();
  }.property(),
  
  popup: nearestChild('popup-menu'),
  
  attachTargets: function () {
    var popup = get(this, 'popup');
    var icon = get(this, 'icon');

    popup.addTarget(icon, {
      on: "click"
    });
  }.on('didInsertElement'),
  
  actions: {
    previousMonth: function () {
      var previousMonth = get(this, 'firstOfMonth').clone().subtract(1, 'month');
      set(this, 'month', previousMonth.month());
      set(this, 'year', previousMonth.year());
    },
    
    nextMonth: function () {
      var nextMonth = get(this, 'firstOfMonth').clone().add(1, 'month');
      set(this, 'month', nextMonth.month());
      set(this, 'year', nextMonth.year());
    },
    
    selectDate: function (date) {
      set(this, 'value', date);
      get(this, 'popup').deactivate();
    }
  },
  
  month: reads('currentMonth'),
  year: reads('currentYear'),
  
  firstOfMonth: function () {
    return moment({ year: get(this, 'year'), month: get(this, 'month') });
  }.property('year', 'month'),

  currentMonth: function () {
    return get(this, 'value') ?
           get(this, 'value').getMonth() :
           new Date().getMonth();
  }.property(),
  
  currentYear: function () {
    return get(this, 'value') ?
           get(this, 'value').getFullYear() :
           new Date().getFullYear();
  }.property(),
  
  displayValue: function () {
    var value = get(this, 'value');
    return value ? moment(value).format("MM/DD/YYYY") : null;
  }.property('value')
});

export default DatePicker;
```

When we deactivate the popup, we're telling it that all targets are not active anymore. That way, the popup hides.

To polish it off, let's add styling. Create a file in addons called `styles/my-date-picker.css` and add the following CSS:

```css
.date-picker .popup-menu {
  padding: 20px;
}

.date-picker header {
  height: 25px;
  position: relative;
}
.date-picker .next-month,
.date-picker .previous-month {
  cursor: pointer;
  position: absolute;
  top: 0;
}

.date-picker .next-month {
  right: 0;
}

.date-picker .previous-month {
  left: 0;
}

.date-picker .month {
  text-align: center;
}

.calendar-month {
  border-collapse: collapse;
  border-spacing: 0;
}

.calendar-month th {
  font-family: sans-serif;
  text-transform: uppercase;
  font-size: 12px;
  height: 30px;
  border-bottom: 1px solid #999;
  border-top: 3px solid #FFF;
  margin-bottom: 5px;
}

.calendar-day {
  cursor: pointer;
  text-align: center;
  width: 20px;
  height: 20px;
  padding: 1px;
}

.calendar-day span {
  display: block;
  padding: 5px;
}

.calendar-day.disabled {
  color: #999;
  cursor: default;
}

.calendar-day.is-today span {
  border: 1px solid #666;
}

.calendar-day.selected span {
  border: 1px solid #FFF;
}
```

If everything went well, you should have a date-picker that behaves like the one here: http://paddle8.github.io/ember-popup-menu/


## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
