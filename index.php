<!DOCTYPE html>

<html ng-app="app">
    <head>
        <base href="/jsonapi/">
        <title>NG-Wordpress</title>
        <?php wp_head(); ?>
    </head>

    <body>
        <header>
            <h1>
                <a href="<?php echo site_url(); ?>">NG-Wordpress Demo Theme</a>
            </h1>
        </header>

        <div ng-view></div>

        <footer>
            &copy; <?php echo date('Y'); ?>
        </footer>
    </body>
</html>