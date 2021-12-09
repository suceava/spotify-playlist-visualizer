export type AmplifyDependentResourcesAttributes = {
    "function": {
        "spotifyauthlogin": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "spotifyauthcallback": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        }
    },
    "api": {
        "spotifyapp": {
            "RootUrl": "string",
            "ApiName": "string",
            "ApiId": "string"
        }
    }
}