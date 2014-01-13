describe('angular-digest-auth', function()
{
    var $regex = /Digest username\=\"([a-z]*)\"/;
    var $authStorage;
    var $authConfig;
    var $authService;
    var $httpBackend;
    var $rootScope;

    beforeEach(angular.mock.module('dgAuth'));

    beforeEach(function()
    {
        var fakeModule = angular.module('test.config', []);
        fakeModule.config(['$authConfigProvider', function($authConfigProvider)
        {
            $authConfigProvider.setSign({
                signin: '/signin',
                signout: '/signout'
            });

            $authConfigProvider.setHeader('X-Auth-Digest');
        }]);

        module('dgAuth', 'test.config');

        inject(function($injector)
        {
            $rootScope = $injector.get('$rootScope');
            spyOn($rootScope, '$broadcast').andCallThrough();

            $authConfig = $injector.get('$authConfig');
            $authService = $injector.get('$authService');

            $authStorage = $injector.get('$authStorage');
            $authStorage.clear();

            $httpBackend = $injector.get('$httpBackend');
            $httpBackend.whenPOST($authConfig.getSign().signin).respond(function(method, url, data, headers)
            {
                var authorization = headers.Authorization;
                if(authorization)
                {
                    var regex = new RegExp($regex);
                    var username = regex.exec(authorization);

                    if(username[1] == 'test')
                    {
                        return [201, '', ''];
                    }
                }

                var responseHeaders = {
                    'X-Auth-Digest': 'Digest ' +
                        'realm="Test AngularJS module", ' +
                        'domain="/", ' +
                        'nonce="32fffd4e446fc7735c4995154674e9d4", ' +
                        'opaque="e66aa41ca5bf6992a5479102cc787bc9", ' +
                        'algorithm="MD5", ' +
                        'qop="auth"'
                };

                return [401, '', responseHeaders];
            });

            $httpBackend.whenPOST($authConfig.getSign().signout).respond(function(method, url, data, headers)
            {
                var authorization = headers.Authorization;
                if(authorization)
                {
                    var regex = new RegExp($regex);
                    var username = regex.exec(authorization);

                    if(username[1] == 'test')
                    {
                        return [201, '', ''];
                    }
                }

                return [400, '', headers];
            });
        });
    });

    afterEach(function()
    {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('ALL', function()
    {
        it('performs the sign in - error', function()
        {
            $authService.signin();

            $httpBackend.expectPOST($authConfig.getSign().signin);
            $httpBackend.flush();

            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('process.request'), jasmine.any(Object));
            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('process.response'), jasmine.any(Object));
            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('authentication.header'), jasmine.any(String), jasmine.any(Object));
            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('signin.required'));

            var login = {
                username: 'fake',
                password: 'fake',
                requested: true
            };

            $authService.setLoginRequest(login.username, login.password);

            $httpBackend.expectPOST($authConfig.getSign().signin);
            $httpBackend.flush();

            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('credential.submitted'), login);
            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('signin.error'), jasmine.any(String), jasmine.any(Number));
        });

        it('performs the sing in - successful', function()
        {
            $authService.signin();

            $httpBackend.expectPOST($authConfig.getSign().signin);
            $httpBackend.flush();

            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('process.request'), jasmine.any(Object));
            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('process.response'), jasmine.any(Object));
            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('authentication.header'), jasmine.any(String), jasmine.any(Object));
            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('signin.required'));

            var login = {
                username: 'test',
                password: 'test',
                requested: true
            };

            $authService.setLoginRequest(login.username, login.password);

            $httpBackend.expectPOST($authConfig.getSign().signin);
            $httpBackend.flush();

            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('credential.submitted'), login);
            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('credential.stored'), {
                username: login.username,
                password: login.password
            });
            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('signin.successful'), jasmine.any(String));

            expect($authService.hasIdentity()).toEqual(true);
        });

        it('performs the sign out - error', function()
        {
            $authService.signin();

            $httpBackend.expectPOST($authConfig.getSign().signin);
            $httpBackend.flush();

            var login = {
                username: 'test',
                password: 'test',
                requested: true
            };

            $authService.setLoginRequest(login.username, login.password);

            $httpBackend.expectPOST($authConfig.getSign().signin);
            $httpBackend.flush();

            $authService.setLoginRequest('fake', 'fake');

            $authService.signout();

            $httpBackend.expectPOST($authConfig.getSign().signout);
            $httpBackend.flush();

            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('signout.error'), jasmine.any(String), jasmine.any(Number));
        });

        it('performs the sign out - successful', function()
        {
            $authService.signin();

            $httpBackend.expectPOST($authConfig.getSign().signin);
            $httpBackend.flush();

            var login = {
                username: 'test',
                password: 'test',
                requested: true
            };

            $authService.setLoginRequest(login.username, login.password);

            $httpBackend.expectPOST($authConfig.getSign().signin);
            $httpBackend.flush();

            $authService.signout();

            $httpBackend.expectPOST($authConfig.getSign().signout);
            $httpBackend.flush();

            expect($rootScope.$broadcast).toHaveBeenCalledWith($authConfig.getEvent('signout.successful'), jasmine.any(String));
        });
    });
});