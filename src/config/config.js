module.exports = {
    GEMINI_API_KEY: "AIzaSyAp4cRu-k8op_ND7mJ1UcluDOf6GPhrNpg",
    OCR_API_KEY: 'K89958106988957',
    GOOGLE_CLOUD_VISION_CREDENTIALS: {
        type: "service_account",
        project_id: "gen-lang-client-0346031146",
        private_key_id: "d21238d0ff6b641fa635233682acc9e59f08a296",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCi3PKsFuclgcmb\nte44aqgBqkMerCtTlmRkmhYS1AEMlRS3+rEF6YIhDRQi48BZFkoxBkHEK9htm2cH\nwzsUQ5eBdIWu0fSiY2/oz24gpQhZrwSgfVrpIZivM/UKOm+NUO1FVStiTOXFRojq\n+IQrranarDT0xj/X363yM0DKdb8UNUpmp0pJv2LMMDkWDHE/liNiEh9SBsVgIZaI\n0BvjdjwufPH91BjerGHGshznCpD4jblalKjwHAMVhQkSTk5F7rXvq0nXhQlVYoOr\nxG1Fr/77JX3EEHPqsk0eZGJMTIqU+Qo308ikhoqmjyf/vrBvhIyYojuHR1MHrcjr\nSauSuAfdAgMBAAECggEACjHMcEtADXqnVRDj/YdnnDBn4oFNIP6sABlzwkVKX4WW\ny2wXgqg662Nh3EvnXBbnbqmBRQyoOowyEdaoWby1Z3a/cNGsVNyRQmshmKIxTfPa\nVUrOKFkLBq846nqn8ETy5UEkkGhXMFcZoPkMxPMqS7Q13bs/KdMoP0idXfmq4VKE\nT6N55R7PbUODjEadnyyPs1/niE9MGkFhJSQ3CtYvhzT0UJKxewxB5Rd+fP9RgNQp\nspNeom2iT8cX7Mlb45pn4FBOPsc+1fLzwK1IO9VuRnuK69xqP7IeMuJv9+V5lD1x\nLv2Ow425rDDuF2UKuWxx+6XuW58mqxxS03GoOfsEnQKBgQDflduIQnghbkKE94nb\nPVcOvAZDIO9IY8yZzePTzI+vYABU/vSjoEBiL3tVgzOORdO+cqnKNS2JkZ272EO7\nz+dgaMqt4ys4XZIiX8B/owcCwirhzhtUiVA6YQUg0Bz8wurtSCeElWlVYnb4q+r0\nRa47aKp8kK2CvgdDgIIsJ6hRJwKBgQC6eXG9H6z7A0KK4jKCAtvoky76cbCkboq7\ntv1pCQhkPZjpctbCfqbD6UAVF+LWAg/rIlgAK5g/ztMp9JbaygFgNyKY5DhZuTyL\nQVeYnSCLJx9BqJO0L1//6h4IUs4swl6mR7g4lzTYSjwclgy5CPXzfjoklYgX/mnD\n0HeEWZK5WwKBgEjWYwxCyyvo5Za3pZtcok3Uhx27TviAOpkob74B+BUj6zfFTyE3\nBYJ3AXDcKyGAMfjrFdEf/dPBMmeNjpNSqYfI265GQUA9i2vTUbzC+Xe2lY22PUUO\n7qn2DVuhMLBPN4VRaj5RBl2glC1ypDorsRT9hfzKjRv4mBkvdji4OqclAoGAJuYE\nguYjqG0CqYQL8zDzfK2PRDEJHxPsHsJKVGnM9VQgHLqW8BWJZh62/m9wIyJk/bC5\nWLe/V7gmNn9OJK+038RAlFIvKxBH/+iOhEhqrHxpucGXpiOny/OjdisH1TBqnBcj\n57IrFN9PcMsgNk0XOUbgjBchP5gTqgRHmjUxNTcCgYAbrnPIEi3Zsh3+Fw5VpfdZ\nmkEIqAV3BJc+8O4b92fStMsFO+SOog9QT1KsuW9x411iKYpGlY0PQA0vuv7wSiE8\n+zu7lmao+5cOUp/qU3gD/zvq3zYp4rtahhvWq7wZaerG+pk+XeAdjWxZ1kLBPWAw\nQ3mxelHmkg+E+YtJgi7C9w==\n-----END PRIVATE KEY-----\n",
        client_email: "fingrip-test@gen-lang-client-0346031146.iam.gserviceaccount.com",
        client_id: "100604561188182367307",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/fingrip-test%40gen-lang-client-0346031146.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
    },
    PORT: process.env.PORT || 3000,
    WHATSAPP_CONFIG: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
}; 