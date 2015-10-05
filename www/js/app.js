angular.module('starter', ['ionic', 'ionic.contrib.ui.tinderCards'])
    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);

            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    })
    .controller('PlaylistCtrl', function($scope, $timeout) {
        function getRandomCard() {
            return {
                title: Math.random().toString(36).substring(7),
                image_url: '',
                location: Math.random().toString(36).substring(7),
                company: {
                    name: Math.random().toString(36).substring(7),
                },
                type: Math.random().toString(36).substring(7),
            };
        }
        function getRandomCards(arr) {
            if (arr.length > 1) {
                return arr;
            }
            arr.push(getRandomCard());
            return getRandomCards(arr);
        }
        $scope.cards = getRandomCards([]);
        $scope.isIOS = false;

        var applyJob = function(index) {};

        var dislikeJob = function(index) {};

        $scope.cardDestroyed = function(index) {
            $scope.$emit('card.should.fade.out', null);
            var item = $scope.cards.splice(index, 1)[0];
            $timeout(function() {
                $scope.cards.unshift(item);
                console.log(JSON.parse(JSON.stringify($scope.cards)));
            }, 5000);
        };

        $scope.cardSwipedLeft = function(index) {
            console.log('$scope.cardSwipedLeft')
            dislikeJob(index);
        };

        $scope.cardSwipedRight = function(index) {
            console.log('$scope.cardSwipedRight')
            applyJob(index);
        };

        $scope.cardPartialSwipe = function(amt) {
            if (amt > 0) {
                $scope.$emit('user.swipe.right.for.yes', {
                    amt: amt < 0.1 ? 0 : amt
                });
            } else {
                $scope.$emit('user.swipe.left.for.no', {
                    amt: amt > -0.1 ? 0 : -amt
                });
            }
        };
        $scope.cardSnapBack = function() {
            $scope.$emit('card.should.fade.out', null);
        };
    })
