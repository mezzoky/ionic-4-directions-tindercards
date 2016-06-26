(function(ionic) {

    // Get transform origin poly
    var d = document.createElement('div');
    var transformKeys = ['webkitTransformOrigin', 'transform-origin', '-webkit-transform-origin', 'webkit-transform-origin',
        '-moz-transform-origin', 'moz-transform-origin', 'MozTransformOrigin', 'mozTransformOrigin'
    ];

    var TRANSFORM_ORIGIN = 'webkitTransformOrigin';
    for (var i = 0; i < transformKeys.length; i++) {
        if (d.style[transformKeys[i]] !== undefined) {
            TRANSFORM_ORIGIN = transformKeys[i];
            break;
        }
    }

    var transitionKeys = ['webkitTransition', 'transition', '-webkit-transition', 'webkit-transition',
        '-moz-transition', 'moz-transition', 'MozTransition', 'mozTransition'
    ];
    var TRANSITION = 'webkitTransition';
    for (var i = 0; i < transitionKeys.length; i++) {
        if (d.style[transitionKeys[i]] !== undefined) {
            TRANSITION = transitionKeys[i];
            break;
        }
    }

    var SwipeableCardView = ionic.views.View.inherit({
        /**
         * Initialize a card with the given options.
         */
        initialize: function(opts) {
            opts = ionic.extend({}, opts);

            ionic.extend(this, opts);

            this.el = opts.el;

            this.parentWidth = this.el.parentNode.offsetWidth;
            this.parentHeight = this.el.parentNode.offsetHeight;
            this.width = this.el.offsetWidth;
            this.height = this.el.offsetHeight;

            this.startX = this.startY = this.x = this.y = 0;
            this.swipeX = this.swipeOutXEffect
            opts.showTransitionIn && this.transitionIn('pop-in');
            this.bindEvents();
        },
        /**
         * Transition in the card with the given animation class
         */
        transitionIn: function(animationClass) {
            var self = this;

            this.el.classList.add(animationClass + '-start');
            this.el.classList.add(animationClass);
            this.el.style.display = 'block';
            setTimeout(function() {
                self.el.classList.remove(animationClass + '-start');
            }, 100);
            setTimeout(function() {
                self.el.classList.remove(animationClass);
            }, 300);
        },

        isUnderThresholdX: function() {
            //return true;
            return Math.abs(this.thresholdAmountX) < 0.4;
        },
        isUnderThresholdY: function() {
            //return true;
            return Math.abs(this.thresholdAmountY) < 0.4;
        },
        /**
         * Fly the card out or animate back into resting position.
         */
        swipeOutXEffect: function(e) {
            console.log(e.gesture.deltaX, e.gesture.deltaY, e.gesture.velocityX, this.thresholdAmountX);
            this.thresholdAmountX = e.gesture.thresholdAmountX || this.thresholdAmountX;
            this.rotationAngle = this.rotationAngle || Math.atan(e.gesture.deltaX / -1000);
            var angle = Math.atan(e.gesture.deltaX / e.gesture.deltaY);

            var dir = this.thresholdAmountX < 0 ? -1 : 1;
            var targetX;
            if (dir > 0) {
                targetX = (this.parentWidth / 2) + (this.width);
            } else {
                targetX = -(this.parentWidth + this.width);
            }

            // Target Y is just the "opposite" side of the triangle of targetX as the adjacent edge (sohcahtoa yo)
            var targetY = targetX / Math.tan(angle);

            // Fly out
            var rotateTo = this.rotationAngle; //(this.rotationAngle this.rotationDirection * 0.2));// || (Math.random() * 0.4);

            var duration = 0.5 - Math.min(Math.max(Math.abs(e.gesture.velocityX) / 10, 0.05), 0.2);

            console.log('Direction:', dir, 'TargetX:', targetX, 'TargetY:', targetY,
                'RotateTo:', rotateTo, 'Duration:', duration, 'el:', this.el
            );
            ionic.requestAnimationFrame(function() {
                this.el.style.transform = this.el.style.webkitTransform = 'translate3d(' + targetX + 'px, ' + targetY + 'px,0) rotate(' + this.rotationAngle + 'rad)';
                this.el.style.transition = this.el.style.webkitTransition = 'all ' + duration + 's ease-in-out';
            }.bind(this));
            // Trigger destroy after card has swiped out
            setTimeout(function() {
                this.onDestroy && this.onDestroy();
            }.bind(this), duration * 1000);
            return duration;
        },
        swipeOutYEffect: function(e) {
            var angle = Math.atan(e.gesture.deltaY / e.gesture.deltaX);

            var dir = this.thresholdAmountY < 0 ? -1 : 1;
            var targettoY;
            if (dir > 0) {
                targettoY = (this.parentHeight / 2) + (this.height);
            } else {
                targettoY = -(this.parentHeight + this.height);
            }

            // Target Y is just the "opposite" side of the triangle of targettoY as the adjacent edge (sohcahtoa yo)
            var tX = targettoY / Math.tan(angle);

            // Fly out
            var rotateTo = this.rotationAngle; //(this.rotationAngle this.rotationDirection * 0.2));// || (Math.random() * 0.4);

            var duration = 0.5 - Math.min(Math.max(Math.abs(e.gesture.velocityY) / 10, 0.05), 0.2);

            console.log('Direction:', dir, 'TargetX:', tX, 'TargetY:', targettoY,
                'RotateTo:', rotateTo, 'Duration:', duration, 'el:', this.el
            );
            ionic.requestAnimationFrame(function() {
                this.el.style.transform = this.el.style.webkitTransform = 'translate3d(' + tX + 'px, ' + targettoY + 'px,0) rotate(' + this.rotationAngle + 'rad)';
                this.el.style.transition = this.el.style.webkitTransition = 'all ' + duration + 's ease-in-out';
            }.bind(this));
            // Trigger destroy after card has swiped out
            setTimeout(function() {
                this.onDestroy && this.onDestroy();
            }.bind(this), duration * 1000);
            return duration;
        },
        transitionOut: function(e) {

            // console.log('this.thresholdAmountX=', this.thresholdAmountX);
            // console.log('this.thresholdAmountY=', this.thresholdAmountY);
            if (
                (!this.isUnderThresholdX() && !this.isUnderThresholdY()) ||
                (this.isUnderThresholdX() && this.isUnderThresholdY())
            ) {
                // console.log('onSnzapBack on thresholdX:', this.thresholdAmountX,
                //     'thresholdY:',this.thresholdAmountY);
                this.onSnapBack(this.x, this.y, this.rotationAngle);
                return;
            }
            // var mag = Math.sqrt(Math.pow(this.thresholdAmountY, 2) + 
            //     Math.pow(this.thresholdAmountX, 2));

            // console.log('toBeDemise on thresholdX:', this.thresholdAmountX,
            //         'thresholdY:',this.thresholdAmountY, 'Magnitude:', mag);

            var detail = this.getSemantic();

            this.onTransitionOut(detail.semantic, detail.amount);
            var blockDirection = this.preventCardDismissDirection && this.preventCardDismissDirection() || [];
            if (blockDirection.indexOf(detail.semantic) > -1) {
                this.onSnapBack(this.x, this.y, this.rotationAngle);
                return;
            }

            if (detail.direction === 'x') {
                duration = this.swipeOutXEffect(e);
            } else {
                duration = this.swipeOutYEffect(e);
            }

            //this.onSwipe && this.onSwipe();


        },

        /**
         * Bind drag events on the card.
         */
        bindEvents: function() {
            var self = this;
            ionic.onGesture('drag', function(e) {
                ionic.requestAnimationFrame(function() {
                    self._doDrag(e);
                });
                // Indicate we want to stop parents from using this
                e.gesture.srcEvent.preventDefault();
            }, this.el);

            ionic.onGesture('dragend', function(e) {
                ionic.requestAnimationFrame(function() {
                    self._doDragEnd(e);
                });
            }, this.el);
        },
        _doDrag: function(e) {
            e.preventDefault();

            var o = e.gesture.deltaX / -1000;

            this.rotationAngle = Math.atan(o);

            this.x = this.startX + (e.gesture.deltaX * 0.8);
            this.y = this.startY + (e.gesture.deltaY * 0.8);

            this.el.style.transform = this.el.style.webkitTransform = 'translate3d(' + this.x + 'px, ' + this.y + 'px, 0) rotate(' + (this.rotationAngle || 0) + 'rad)';


            this.thresholdAmountX = (this.x / (this.parentWidth / 2));
            this.thresholdAmountY = (this.y / (this.parentHeight / 2));

            setTimeout(function() {
                this.onPartialSwipe(this.getSemantic());
            }.bind(this));
        },
        _doDragEnd: function(e) {
            console.log('_doDragEnd')
            this.transitionOut(e);
        },
        getSemantic: function() {
            var definition = function(direction, amount) {
                var direction_semantic = '';
                if (direction === 'x') {
                    direction_semantic = amount > 0 ? 'right' : 'left';
                } else {
                    direction_semantic = amount > 0 ? 'bottom' : 'top';
                }
                return direction_semantic;
            };
            var direction = Math.abs(this.thresholdAmountX) > Math.abs(this.thresholdAmountY) ? 'x' : 'y';
            var amount = direction === 'x' ? this.thresholdAmountX : this.thresholdAmountY;
            var direction_semantic = definition(direction, amount);
            var semantic = {
                direction: direction,
                semantic: direction_semantic,
                amount: Math.abs(amount)
            };
            return semantic;
        }
    });


    angular.module('ionic.contrib.ui.tinderCards', ['ionic'])

    .directive('tdCard', ['$timeout', function($timeout) {
        function onScopeCallback(fn, extras) {
            $timeout(function() {
                if (typeof extras !== 'undefined') {
                    fn(extras);
                } else {
                    fn();
                }
            });
        }

        return {
            restrict: 'E',
            template: '<div class="td-card" ng-transclude></div>',
            require: '^tdCards',
            transclude: true,
            scope: {
                onTransitionLeft: '&',
                onTransitionRight: '&',
                onTransitionTop: '&',
                onTransitionBottom: '&',
                onTransitionOut: '&',
                onPartialSwipe: '&',
                onSnapBack: '&',
                onDestroy: '&',
                block: '&',
            },
            compile: function(element, attr) {
                return function($scope, $element, $attr, tdCardsController) {

                    var el = $element[0];

                    // Force hardware acceleration for animation - better performance on first touch
                    el.style.transform = el.style.webkitTransform = 'translate3d(0px, 0px, 0px)';

                    // Instantiate our card view
                    var swipeableCard = new SwipeableCardView({

                        preventCardDismissDirection: function() {
                            return $scope.block();
                        },

                        el: el,
                        showTransitionIn: (tdCardsController.getNumberOfChild() === 5),
                        onPartialSwipe: function(data) {
                            tdCardsController.partial(data.amount);
                            onScopeCallback($scope.onPartialSwipe, {
                                data: data
                            });
                        },
                        onTransitionOut: function(direction, amt) {
                            (direction === 'top') && onScopeCallback($scope.onTransitionTop);
                            (direction === 'bottom') && onScopeCallback($scope.onTransitionBottom);
                            (direction === 'left') && onScopeCallback($scope.onTransitionLeft);
                            (direction === 'right') && onScopeCallback($scope.onTransitionRight);
                            onScopeCallback($scope.onTransitionOut, {
                                direction: direction,
                                amt: amt
                            });
                        },
                        onDestroy: function() {
                            tdCardsController.dropChild();
                            onScopeCallback($scope.onDestroy);
                        },
                        onSnapBack: function(startX, startY, startRotation) {
                            var animation = collide.animation({
                                // 'linear|ease|ease-in|ease-out|ease-in-out|cubic-bezer(x1,y1,x2,y2)',
                                // or function(t, duration),
                                // or a dynamics configuration (see below)
                                duration: 500,
                                percent: 0,
                                reverse: false
                            })

                            .easing({
                                type: 'spring',
                                frequency: 15,
                                friction: 250,
                                initialForce: false
                            })

                            .on('step', function(v) {
                                    //Have the element spring over 400px
                                    // console.log('on step');
                                    el.style.transform = el.style.webkitTransform = 'translate3d(' + (startX - startX * v) + 'px, ' + (startY - startY * v) + 'px, 0) rotate(' + (startRotation - startRotation * v) + 'rad)';
                                })
                                .start();

                            onScopeCallback($scope.onSnapBack);
                        },
                    });
                    // $scope.$parent.swipeCard = swipeableCard;
                    $scope.$on('tdCard.pop', function(event, data) {
                        if (data.id === $scope.$parent.card.id) {
                            var e = {
                                gesture: {
                                    deltaY: -2.47914017187543,
                                    deltaX: -339.0162866557602,
                                    velocityX: 0.2092390934220925,
                                    thresholdAmountX: -1.7144941857587446,
                                }
                            };
                            var f = {
                              gesture: {
                                    deltaY: 2.47914017187543,
                                    deltaX: 339.0162866557602,
                                    velocityX: 0.2092390934220925,
                                    thresholdAmountX: 1.7144941857587446,
                                }  
                            }
                            swipeableCard.swipeX(data.target === 'left' ? e : f);
                        }
                    });
                };
            }
        };
    }])

    .directive('tdCards', [function() {
        return {
            restrict: 'E',
            template: '<div class="td-cards" ng-transclude></div>',
            transclude: true,
            scope: {},
            controller: ['$scope', '$element', function($scope, $element) {
                var self = this;

                var childs = 0;
                this.getNumberOfChild = function() {
                    childs += 1;

                    existingCards = $element[0].querySelectorAll('td-card');
                    for (i = 0; i < existingCards.length; i++) {
                        card = existingCards[i];
                        if (!card) continue;
                        card.style.zIndex = (existingCards.length - i);
                    }
                    return childs;
                };
                this.dropChild = function() {
                    childs -= 1;
                };

                // var bringCardUp = function(card, amt, max) {
                //     console.log('bringCardUp')
                //     var position, newTop;
                //     position = card.style.transform || card.style.webkitTransform;
                //     newTop = Math.max(0, Math.min(max, max - (max * Math.abs(amt))));
                //     card.style.transform = card.style.webkitTransform = 'translate3d(0, ' + newTop + 'px, 0)';
                // };

                this.partial = function(amt) {
                    // console.log('this.partial')
                    // cards = $element[0].querySelectorAll('td-card');
                    // firstCard = cards[0];
                    // secondCard = cards.length > 2 && cards[1];
                    // thirdCard = cards.length > 3 && cards[2];

                    // secondCard && bringCardUp(secondCard, amt, 4);
                    // thirdCard && bringCardUp(thirdCard, amt, 8);
                };
            }]
        };
    }])

    .factory('TDCardDelegate', function($rootScope) {
        return {
            popCard: function(data) {
                $rootScope.$broadcast('tdCard.pop', data);
            },
            getSwipeableCard: function($scope) {
                console.log($scope)
                    // return $scope.swipeCard;
            }
        }
    });

})(window.ionic);
