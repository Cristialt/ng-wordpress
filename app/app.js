angular.module('app', ['ngRoute'])

    .config(function($routeProvider, $locationProvider) {
        $routeProvider

            .when('/', {
                templateUrl: myLocalized.partials + 'main.html',
                controller: 'Main'
            })

            .when('/:ID', {
                templateUrl: myLocalized.partials + 'content.html',
                controller: 'Content'
            });

        $locationProvider.html5Mode({
            enabled:false,
            requireBase: false
        });
    })

    .controller('Main', function($scope, $http) {
        $http.get('/wp-json/posts/').success(function(res){
            $scope.posts = res;
        });
    })

    .controller('Content', function($scope, $http, $routeParams) {
        $http.get('/wp-json/posts/' + $routeParams.ID).success(function(res){
            $scope.post = res;
            console.log(res);
        });
    });
