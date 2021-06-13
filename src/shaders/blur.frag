precision highp float;
precision highp int;

out vec4 pc_FragColor;

in vec2 TexCoords;

uniform sampler2D tDiffuse;
uniform sampler2D tNoise;

void main() {

  vec2 texelSize = 1.0 / vec2(textureSize(tDiffuse, 0)); 

  float result = 0.0;
  for (int x = -2; x < 2; ++x) 
  {
      for (int y = -2; y < 2; ++y) 
      {
          vec2 offset = vec2(float(x), float(y)) * texelSize;
          result += texture(tDiffuse, TexCoords + offset).r;
      }
  }
  float FragColor = result / (4.0 * 4.0);
  
	pc_FragColor.rgb = vec3(FragColor);
	pc_FragColor.a = 1.0;
}