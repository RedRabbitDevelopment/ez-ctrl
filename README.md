ez-ctrl
=======

## Installation

    $ npm install ez-ctrl

## Features

  * Built on [Express](https://raw.github.com/visionmedia/express)
  * Has all the same features as express
  * Decouples data retrieval, data validation, and logic for better testing
  * DRY - focus more on logic and less on sanitation
  * DRY - validate input on the front-end and back-end simultaneously (coming soon!)

## Philosophy

  The EZController philosophy was inspired by Ruby on Rails, but with a few
  changes. The basic idea is to make testing for validation, routing, and
  logic built right in, by removing most references to req and res in the
  business logic of the application.
  
  Also, in the future, we hope to be able to create a way for the developers
  to reuse the validation code on the front-end, essentially building 
  front-end and back-end validation at the same time.

## License

(The MIT License)

Copyright (c) 2009-2012 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.