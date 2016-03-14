dgAuth.provider('authRequests', ['dgAuthServiceProvider', function AuthRequestsProvider(dgAuthServiceProvider)
{
    function AuthRequest(limit, config, $http, authService, stateMachine)
    {
        /**
         *
         *
         * @type {promise|null}
         * @private
         */
        var _promise = null;

        /**
         *
         *
         * @returns {promise|null}
         */
        this.getPromise = function()
        {
            return _promise;
        };

        /**
         *
         * @type {number}
         * @private
         */
        var _times = 0;

        /**
         *
         * @returns {boolean}
         */
        this.getValid = function()
        {
            if('inf' == limit)
                return true;

            return (_times <= limit);
        };

        /**
         *
         * @returns {promise}
         */
        this.signin = function()
        {
            _times++;

            _promise = $http(config.login).then(function(response)
                {
                    _times = 0;
                    stateMachine.send('201', {response: response});

                    return response;
                },
                function(response)
                {
                    _times = 0;
                    stateMachine.send('failure', {response: response});

                    return response;
                });

            return _promise;
        };

        /**
         *
         * @returns {promise}
         */
        this.signout = function()
        {

            _promise = $http(config.logout).then(function(response)
                {
                    stateMachine.send('201', {response: response});

                    return response;
                },
                function(response)
                {
                    return response;
                });
            return _promise;
        };
    }

    this.$get = ['$http', 'authService', 'stateMachine', function($http, authService, stateMachine)
    {
        return new AuthRequest(dgAuthServiceProvider.getLimit(), dgAuthServiceProvider.getConfig(), $http, authService, stateMachine);
    }];
}]);
