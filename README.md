# hl7-tools

This web application allows a user to load in an HL7 v2 message and display it in color coded display.  As the mouse moves over the message details of the HL7 element uner the pointer are listed below.

Users may edit the message by clicking any element and typing in the new value.  Any matching values will be found and may be replaced as well, for example if you edit the last name component in PID-5-1 you will be prompted to replace that value anywhere else it is found.  This can be useful for anonymizing the HL7 message.

Users can search the message for text, or to see what data is at a specific location in the message.  Matches will be highlighted in the display and listed in the detail section.

Once a message has been edited the user may download it.

This application has no server component, all manipulation is done client side. Using a framework like Ember is obviously overkill, this was just a learning experiment to get a feel for the framework.  I've also tried not to use any other libraries as I'm too dependent on JQuery and Bootstrap these days so this uses vanilla js and css as much as possible.

This is currently hosted at http://greathall-hl7.surge.sh/hl7.

Below is the README for a default Ember project

This README outlines the details of collaborating on this Ember application.
A short introduction of this app could easily go here.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with npm)
* [Ember CLI](https://ember-cli.com/)
* [Google Chrome](https://google.com/chrome/)

## Installation

* `git clone <repository-url>` this repository
* `cd hl7-tools`
* `npm install`

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).
* Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Running Tests

* `ember test`
* `ember test --server`

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

Specify what it takes to deploy your app.

## Further Reading / Useful Links

* [ember.js](https://emberjs.com/)
* [ember-cli](https://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)
