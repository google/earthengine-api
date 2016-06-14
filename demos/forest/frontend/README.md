# Global Forest Change Explorer

To run a local instance of the app:

*   Clone the git repository to your local file system

*   Install nodejs 4.x locally either via nvm at
    https://github.com/creationix/nvm or https://nodejs.org/download/

*   Verify that nvm has been installed.

    ```
    $ command -v nvm
    ```
    *   Should respond with "nvm"

    ```
    $ nvm install 4
    ```

*   From your cloned repository, change to the `/demos/forest/frontend`
    directory.

    ```
    $ cd /demos/forest/frontend
    ```

*   Install the [Polymer-CLI]
    (https://www.polymer-project.org/1.0/docs/tools/polymer-cli).

    ```
    $ npm install -g polymer-cli
    ```

*   Install [bower]
    (https://elements.polymer-project.org/guides/using-elements#installing-with-bower),
    which is used to manage Polymer components.

    ```
    $ npm install -g bower
    ```

*   Install the Polymer elements using bower.

    ```
    $ bower install
    ```

*   Run a local web server.

    ```
    $ polymer serve -o
    ```
