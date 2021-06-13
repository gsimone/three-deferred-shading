in vec3 position;
in vec3 normal;
in vec2 uv;
in mat4 instanceMatrix;
in vec3 instanceColor;

out vec3 FragPos;
out vec3 Normal;
out vec3 vInstanceColor;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

void main() {
	
	#ifdef INSTANCED
		vec4 viewPos = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.);
		vInstanceColor = instanceColor;
	#else
		vec4 viewPos = viewMatrix * modelMatrix * vec4(position, 1.);
	#endif

	FragPos = viewPos.xyz;
	Normal = normalMatrix * normal;

	gl_Position = projectionMatrix * viewPos;
}