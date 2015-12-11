(function () {
    var app = angular.module('location', ['ui.bootstrap', 'api', 'modal']);

    app.controller('LocationListCtrl', LocationListCtrl);
    app.controller('LocationEntryCtrl', LocationEntryCtrl);

    function LocationEntryCtrl($scope, $routeParams, locationApi) {

        $scope.data = {};
        if ($routeParams.id) {
            $scope.heading = 'Location Bearbeiten';
            $scope.data = locationApi.get({id: $routeParams.id});
        } else {
            $scope.heading = 'Hinzufügen einer Location';
        }

        $scope.save = function (){
            console.log("isActive", $scope.data.isActive);
            console.log('DATA TO SAVE');
            console.log($scope.data);
            if($routeParams.id){
                $scope.data.$update(function () {
                    location.href = '#/listlocations';
                });
            } else {
                locationApi.save($scope.data, function () {
                    location.href = '#/listlocations';
                });
            }
        }
    }

    function LocationListCtrl($scope, locationApi, $uibModal){
        console.log(locationApi.query());
        $scope.entity = 'location';
        $scope.name = 'Ort';
        $scope.tableheaders = {
            isActive: 'Aktiv?',
            name: 'Raumname',
            description: 'Beschreibung'
        };
        $scope.loadEntries = function(){
            locationApi.query((function(data){
            console.log(data);
            $scope.data = data;
        }));};


        $scope.loadEntries();

        $scope.delete = function(id) {
            locationApi.delete({id:id});
            $scope.loadEntries();
        };

        $scope.animationsEnabled = true;

        $scope.ok = function (id) {
            $scope.id = id;
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '../shared/templates/modal/confirm_delete_modal.html',
                controller: 'ModalCtrl',
                resolve: {
                    message: function() {
                        $scope.message = {
                            header: 'Ort löschen',
                            text: 'Ort wirklich löschen?',
                            confirmButtonText: 'Löschen',
                            cancelButtonText: 'Abbrechen'
                        };
                        return $scope.message;
                    },
                    callback: function() {
                        return function (success) {
                            if(success) {
                                $scope.delete(id);
                            }
                        };
                    },
                    parameter: function () {
                        return id;
                    }
                }
            });
        };
        $scope.toggleAnimation = function () {
            $scope.animationsEnabled = !$scope.animationsEnabled;
        };
    }

})();