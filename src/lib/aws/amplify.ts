// src/lib/aws/amplify.ts
import { Amplify } from "aws-amplify";

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_QVY45GkDF",
      userPoolClientId: "7g2v6cug33o2soil5s5eoi03t",
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code" as const,
      userAttributes: {
        email: {
          required: true,
        },
        given_name: {
          required: true,
        },
        family_name: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

Amplify.configure(amplifyConfig, { ssr: true });

export default amplifyConfig;