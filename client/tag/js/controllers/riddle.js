(function () {
    var app = angular.module('schnitzelApp');

    app.controller('RiddleCtrl', RiddleCtrl);


    function RiddleCtrl($scope, $http, $rootScope) {
        $scope.riddle = {};
        $scope.solve = function(){
            console.log('clicked solvebutton');
            console.log($scope.riddle.answer);
            $http.post('/api/game/solve/'+$scope.game.sessionID, {answer: $scope.riddle.answer}).then(function(res){
                if(res.status == 200){
                    if(res.data.correctAnswer){
                        console.log('Right answer !!!');
                        $rootScope.$broadcast('alert', 'Richtige Antwort', 'success');
                        $rootScope.$broadcast('fetchState');
                    }else{
                        $rootScope.$broadcast('alert', 'Falsche Antwort', 'danger');
                        console.log('Wrong answer !');
                    }
                }else {
                    // TODO: Errorhandling
                }
            });
        };
    }
})();