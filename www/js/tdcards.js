(function(ionic) {

    /*
        TODOS
            add UP and DOWN swipe support!
            add programmable API for only swipe left-right or up-down or even left-up-down-right

            not allow improper directions such as:
                -x+y top+left
                +x+y top+right
                -x-y bottom+left
                +x-y bottom+right

    */


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
            this.width = this.el.offsetWidth;

            this.startX = this.startY = this.x = this.y = 0;

            this.bindEvents();
        },
        /**
         * Transition in the card with the given animation class
         */
        transitionIn: function(animationClass) {
            console.log('transitionIn')
            var self = this;

            this.el.classList.add(animationClass + '-start');
            this.el.classList.add(animationClass);
            this.el.style.display = 'block';
            setTimeout(function() {
                self.el.classList.remove(animationClass + '-start');
            }, 100);
        },

        isUnderThreshold: function() {
            //return true;
            return Math.abs(this.thresholdAmount) < 0.4;
        },

        /**
         * Fly the card out or animate back into resting position.
         */
        transitionOut: function(e) {

            console.log('this.thresholdAmount=', this.thresholdAmount);
            console.log('this.x=', this.x);
            console.log('this.y=', this.y);

            if (this.isUnderThreshold()) {
                this.onSnapBack(this.x, this.y, this.rotationAngle);
                return;
            }

            console.log('discard the card!');

            this.onTransitionOut(this.thresholdAmount);

            var angle = Math.atan(e.gesture.deltaX / e.gesture.deltaY);

            var dir = this.thresholdAmount < 0 ? -1 : 1;
            var targetX;
            if (this.x > 0) {
                targetX = (this.parentWidth / 2) + (this.width);
            } else {
                targetX = -(this.parentWidth + this.width);
            }

            // Target Y is just the "opposite" side of the triangle of targetX as the adjacent edge (sohcahtoa yo)
            var targetY = targetX / Math.tan(angle);

            // Fly out
            var rotateTo = this.rotationAngle; //(this.rotationAngle this.rotationDirection * 0.2));// || (Math.random() * 0.4);

            var duration = 0.3 - Math.min(Math.max(Math.abs(e.gesture.velocityX) / 10, 0.05), 0.2);

            ionic.requestAnimationFrame(function() {
                this.el.style.transform = this.el.style.webkitTransform = 'translate3d(' + targetX + 'px, ' + targetY + 'px,0) rotate(' + this.rotationAngle + 'rad)';
                this.el.style.transition = this.el.style.webkitTransition = 'all ' + duration + 's ease-in-out';
            }.bind(this));

            //this.onSwipe && this.onSwipe();

            // Trigger destroy after card has swiped out
            setTimeout(function() {
                this.onDestroy && this.onDestroy();
            }.bind(this), duration * 1000);
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


            this.thresholdAmount = (this.x / (this.parentWidth / 2));

            setTimeout(function() {
                this.onPartialSwipe(this.thresholdAmount);
            }.bind(this));
        },
        _doDragEnd: function(e) {
            console.log('_doDragEnd')
            this.transitionOut(e);
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
                onTransitionOut: '&',
                onPartialSwipe: '&',
                onSnapBack: '&',
                onDestroy: '&'
            },
            compile: function(element, attr) {
                return function($scope, $element, $attr, tdCardsController) {

                    var el = $element[0];

                    // Force hardware acceleration for animation - better performance on first touch
                    el.style.transform = el.style.webkitTransform = 'translate3d(0px, 0px, 0px)';

                    // Instantiate our card view
                    var swipeableCard = new SwipeableCardView({
                        el: el,
                        onPartialSwipe: function(amt) {
                            tdCardsController.partial(amt);
                            onScopeCallback($scope.onPartialSwipe, {
                                amt: amt
                            });
                        },
                        onSwipeRight: function() {
                            console.log('swipeableCard.onSwipeRight')
                            onScopeCallback($scope.onSwipeRight);
                        },
                        onSwipeLeft: function() {
                            console.log('swipeableCard.onSwipeLeft')
                            onScopeCallback($scope.onSwipeLeft);
                        },
                        onTransitionRight: function() {
                            console.log('called by swipeableCard.onTransitionOut: swipeableCard.onTransitionRight')
                            onScopeCallback($scope.onTransitionRight);
                        },
                        onTransitionLeft: function() {
                            console.log('called by swipeableCard.onTransitionOut: swipeableCard.onTransitionLeft')
                            onScopeCallback($scope.onTransitionLeft);
                        },
                        onTransitionOut: function(amt) {
                            if (amt < 0) {
                                swipeableCard.onTransitionLeft();
                            } else {
                                swipeableCard.onTransitionRight();
                            }
                            onScopeCallback($scope.onTransitionOut, {
                                amt: amt
                            });
                        },
                        onDestroy: function() {
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
                                    console.log('on step');
                                    el.style.transform = el.style.webkitTransform = 'translate3d(' + (startX - startX * v) + 'px, ' + (startY - startY * v) + 'px, 0) rotate(' + (startRotation - startRotation * v) + 'rad)';
                                })
                                .start();

                            onScopeCallback($scope.onSnapBack);
                        },
                    });
                    $scope.$parent.swipeCard = swipeableCard;
                };
            }
        };
    }])

    .directive('tdCards', ['$rootScope', '$timeout', function($rootScope, $timeout) {
        return {
            restrict: 'E',
            template: '<div class="td-cards" ng-transclude></div>',
            transclude: true,
            scope: {},
            controller: ['$scope', '$element', function($scope, $element) {
                /*
                    TODOS
                        we have to implement the tdcards manager here
                        for the stacked cards effect!
                        Update the stack everytime when a new card is added.

                */

                var cards;
                var firstCard, secondCard, thirdCard;

                var existingCards, card;

                var i, j;

                var sortCards = function() {
                    console.log('sortCards')
                    existingCards = $element[0].querySelectorAll('td-card');

                    for (i = 0; i < existingCards.length; i++) {
                        card = existingCards[i];
                        if (!card) continue;
                        if (i > 0) {
                            card.style.transform = card.style.webkitTransform = 'translate3d(0, ' + (i * 4) + 'px, 0)';
                        }
                        card.style.zIndex = (existingCards.length - i);
                    }
                };

                $timeout(function() {
                    // sortCards();
                });

                var bringCardUp = function(card, amt, max) {
                    console.log('bringCardUp')
                    var position, newTop;
                    position = card.style.transform || card.style.webkitTransform;
                    newTop = Math.max(0, Math.min(max, max - (max * Math.abs(amt))));
                    card.style.transform = card.style.webkitTransform = 'translate3d(0, ' + newTop + 'px, 0)';
                };

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
        }
    }])

    .factory('TDCardDelegate', ['$rootScope', function($rootScope) {
        return {
            popCard: function($scope, isAnimated) {
                $rootScope.$emit('tdCard.pop', isAnimated);
            },
            getSwipeableCard: function($scope) {
                return $scope.swipeCard;
            }
        }
    }]);

})(window.ionic);
