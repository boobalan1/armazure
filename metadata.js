{
  "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "vmName": {
      "type": "string",
      "metadata": {
        "description": "VM machine name"
      }
    },
    "vmSize": {
      "type": "string",
      "metadata": {
        "description": "Use Azure VM size name from MSDN"
      }
    },
    "winImageOffer": {
      "type": "string",
      "metadata": {
        "description": "Gallery Image Offer"
      }
    },
    "winImageSku": {
      "type": "string",
      "metadata": {
        "description": "Gallery Image SKU"
      }
    },
    "winImageVersion": {
      "type": "string",
    },
    "vmLocation": {
      "type": "string",
      "metadata": {
        "description": "VM data center location. User Azure location from MDSN"
      }
    },
    "username": {
      "type": "string",
      "metadata": {
        "description": "VM local administrator username"
      }
    },
    "password": {
      "type": "securestring",
      "metadata": {
        "description": "VM local administrator password"
      }
    },
    "storageName": {
      "type": "string",
      "metadata": {
        "description": "VM data and OS disks storage service"
      }
    },
    "storageType": {
      "type": "string",
      "defaultValue": "Standard_LRS",
      "allowedValues": [
        "Standard_LRS",
        "Standard_GRS",
        "Standard_ZRS"
      ],
      "metadata": {
        "description": "IaaS VM data and OS disks storage type"
      }
    },
    "vnetName": {
      "type": "string",
      "metadata": {
        "description": "VM virtual network name"
      }
    },
    "networkAddressSpace": {
      "type": "string",
      "metadata": {
        "description": "VM virtual network IPv4 address space"
      }
    },
    "subnetName": {
      "type": "string",
      "metadata": {
        "description": "VM virtual network subnet name"
      }
    },
    "subnetAddressPrefix": {
      "type": "string",
      "metadata": {
        "description": "VM virtual network subnet IPv4 address prefix"
      }
    },
    "publicDnsName": {
      "type": "string",
      "metadata": {
        "description": "DNS name for the VM"
      }
    }
  },
  "variables": {
    "vmnic": "[concat(parameters('vmName'), 'devnic')]",
    "vmosdisk": "[concat(parameters('vmName'), 'osdisk')]",
    "virtualNetworkID": "[resourceId('Microsoft.Network/virtualNetworks',parameters('vnetName'))]",
    "vnetSubNetID": "[concat(variables('virtualNetworkID'),'/subnets/',parameters('subnetName'))]"
  },
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "name": "[parameters('storageName')]",
      "apiVersion": "2015-05-01-preview",
      "location": "[parameters('vmlocation')]",
      "properties": {
        "accountType": "[parameters('storageType')]"
      }
    },
    {
      "type": "Microsoft.Network/publicIPAddresses",
      "apiVersion": "2015-05-01-preview",
      "name": "[parameters('publicDnsName')]",
      "location": "[parameters('vmLocation')]",
      "properties": {
        "publicIPAllocationMethod": "Dynamic",
        "dnsSettings": {
          "domainNameLabel": "[parameters('publicDnsName')]"
        }
      }
    },
    {
      "type": "Microsoft.Network/virtualNetworks",
      "apiVersion": "2015-05-01-preview",
      "name": "[parameters('vnetName')]",
      "location": "[parameters('vmLocation')]",
      "properties": {
        "addressSpace": {
          "addressPrefixes": [
            "[parameters('networkAddressSpace')]"
          ]
        },
        "subnets": [
          {
            "name": "[parameters('subnetName')]",
            "properties": {
              "addressPrefix": "[parameters('subnetAddressPrefix')]"
            }
          }
        ]
      }
    },
    {
      "apiVersion": "2015-05-01-preview",
      "type": "Microsoft.Network/networkInterfaces",
      "name": "[variables('vmnic')]",
      "location": "[parameters('vmLocation')]",
      "dependsOn": [
        "[concat('Microsoft.Network/publicIPAddresses/', parameters('publicDnsName'))]",
        "[concat('Microsoft.Network/virtualNetworks/', parameters('vnetName'))]"
      ],
      "properties": {
        "ipConfigurations": [
          {
            "name": "devipconfig1",
            "properties": {
              "privateIPAllocationMethod": "Dynamic",
              "publicIPAddress": {
                "id": "[resourceId('Microsoft.Network/publicIPAddresses',parameters('publicDnsName'))]"
              },
              "subnet": {
                "id": "[variables('vnetSubNetID')]"
              }
            }
          }
        ]
      }
    },
    {
      "type": "Microsoft.Compute/virtualMachines",
      "apiVersion": "2015-05-01-preview",
      "name": "[parameters('vmName')]",
      "location": "[parameters('vmLocation')]",
      "dependsOn": [
        "[concat('Microsoft.Storage/storageAccounts/', parameters('storageName'))]",
        "[concat('Microsoft.Network/networkInterfaces/', variables('vmnic'))]"
      ],
      "properties": {
        "hardwareProfile": {
          "vmSize": "[parameters('vmSize')]"
        },
        "osProfile": {
          "computername": "[parameters('vmName')]",
          "adminUserName": "[parameters('username')]",
          "adminPassword": "[parameters('password')]"
        },
        "storageProfile": {
          "imageReference": {
            "publisher": "MicrosoftWindowsServer",
            "offer": "[parameters( 'winImageOffer')]",
            "sku": "[parameters('winImageSku')]",
            "version": "[parameters('winImageVersion')]"
          },
          "osDisk": {
            "name": "[variables('vmosdisk')]",
            "vhd": {
              "uri": "[concat('http://',parameters('storageName'),'.blob.core.windows.net/vhds/', variables('vmosdisk'),'.vhd')]"
            },
            "caching": "ReadWrite",
            "createOption": "FromImage"
          }
        },
        "networkProfile": {
          "networkInterfaces": [
            {
              "id": "[resourceId('Microsoft.Network/networkInterfaces', variables('vmnic'))]"
            }
          ]
        }
      }
    }
  ]
}
