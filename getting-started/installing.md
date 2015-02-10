# Installing

First create a directory to hold your application, if you haven't already dont so, and make that your working directory.
```sh
$ mkdir myapp
$ cd myapp
```

Create a `package.json` file in the directory of interest, if it does not exist already, with the `npm init` command.

```sh
$ npm init
```

Install EZ Controller in the app directory and save it in the dependencies list:

```sh
$ npm install --save ez-ctrl
```

If you plan on attaching your controllers to an express/socket.io app, install those as well:

```sh
$ npm install --save express body-parser serve-static
```

Checkout the examples to learn more:

Express example
Socket.io example

That's it!
