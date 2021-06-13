precision highp float;
precision highp int;

out vec4 pc_FragColor;

in vec2 TexCoords;

uniform sampler2D tAlbedo;
uniform sampler2D tNormal;
uniform sampler2D tWorld;

uniform vec3 samples[64];
uniform mat4 projection;
uniform sampler2D noise;

uniform float radius;
uniform int kernelSize;
uniform float bias;
uniform vec2 noiseScale;

void main() {
	vec3 Albedo = texture( tAlbedo, TexCoords ).rgb;
	vec3 Normal = texture( tNormal, TexCoords ).rgb;
	vec3 FragPos = texture( tWorld, TexCoords ).rgb;
	
	vec3 randomVec = normalize(texture(noise, TexCoords * noiseScale).xyz);  

	// Using a process called the Gramm-Schmidt process we create an orthogonal basis, 
	// each time slightly tilted based on the value of randomVec.
	vec3 tangent   = normalize(randomVec - Normal * dot(randomVec, Normal));
	vec3 bitangent = cross(Normal, tangent);
	mat3 TBN       = mat3(tangent, bitangent, Normal);  
	
	float occlusion = 0.;
	for (int i = 0; i < kernelSize; i++) {
		// transform sample to view-space
		vec3 samplePos = TBN * samples[i];
		samplePos = FragPos + samplePos * radius;
		
		vec4 offset = vec4(samplePos, 1.0);
		offset = projection * offset; // from view space to clip space
		offset.xyz /= offset.w; // perspective divide	
		offset.xyz  = offset.xyz * 0.5 + 0.5; // transform to range 0.0 - 1.0  

		float sampleDepth = texture( tWorld, offset.xy).z; // get depth value of kernel sample

		float rangeCheck = smoothstep(0.0, 1.0, radius / abs(FragPos.z - sampleDepth));
		// bias helps visually tweak the SSAO effect and solves acne effects that may occur based on the scene's complexity
		occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;         
	}

	occlusion = 1. - (occlusion / float(kernelSize));
	pc_FragColor.rgb = vec3(occlusion);
	pc_FragColor.a = 1.0;
}