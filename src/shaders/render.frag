precision highp float;
precision highp int;

out vec4 pc_FragColor;

in vec2 TexCoords;

uniform sampler2D tAlbedo;
uniform sampler2D tNormal;
uniform sampler2D tWorld;
uniform sampler2D tMaterial;

uniform sampler2D tAmbientOcclusion;

uniform vec3 viewPos;

uniform float time;

uniform vec3 lightPosition;
uniform vec3 samples[64];
uniform mat4 projection;
uniform sampler2D noise;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

const float radius = 0.05;
const int kernelSize = 64;
const float bias = 0.025;

void main() {

	vec3 Albedo = texture( tAlbedo, TexCoords ).rgb;
	vec3 Normal = texture( tNormal, TexCoords ).rgb;
	vec3 FragPos = texture( tWorld, TexCoords ).rgb;
	vec3 Material = texture( tMaterial, TexCoords ).rgb;
	vec3 AmbientOcclusion = texture( tAmbientOcclusion, TexCoords ).rgb;
	
	// LIGHT CALCS
	//
	vec3 lightColor = vec3(1.);

	float ambientStrength = 0.3;
	vec3 ambient = vec3(ambientStrength * lightColor * (AmbientOcclusion));
	vec3 lightPositionView = lightPosition;
	vec3 lightDir = normalize( lightPositionView - FragPos );
	float diffuse = max(dot(Normal, lightDir), 0.);
	
	// 
	// Convert the float value back to int to get material id 
	// @TODO find a way to centralize this so that there's less hardcoding
	//
	int MaterialId = int(Material.r * 256.);
	pc_FragColor.rgb = Material;

	if (MaterialId == 128) {
		//
		// Specular
		// 
		vec3 viewDir = normalize(viewPos - FragPos);
		vec3 reflectDir = reflect(-lightDir, Normal);  

		float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.);

		// hardcoded specular strength
		float specularStrength = 1.;
		vec3 specular = specularStrength * spec * lightColor;  

		pc_FragColor.rgb = vec3(ambient + diffuse + specular) * Albedo;
	}

	if (MaterialId == 0) {
		pc_FragColor.rgb = vec3(ambient + diffuse) * Albedo;
	}

	pc_FragColor.a = 1.0;

}